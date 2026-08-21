import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CartItem from "@/lib/models/cart";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import Coupon from "@/lib/models/coupon";
import User from "@/lib/models/user";
import CheckoutIdempotency from "@/lib/models/checkoutIdempotency";
import { createNotification } from "@/lib/createNotification";
import { validateCoupon } from "@/lib/validateCoupon";
import { invalidImageMessage } from "@/lib/validateImageUrl";
import { validateCheckoutItem, type CheckoutCartItem, type CheckoutProduct } from "@/lib/checkoutValidation";

const STALE_PROCESSING_MS = 60_000;

class CheckoutValidationError extends Error {}

class DuplicateCompletedCheckoutError extends Error {
  orderIds: string[];
  constructor(orderIds: string[]) {
    super("Checkout already completed");
    this.orderIds = orderIds;
  }
}

class CheckoutInProgressError extends Error {}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

/**
 * Atomically claims an idempotency key for this buyer. A unique index on
 * (buyer, key) means only one of two racing requests with the same key
 * can ever insert successfully — the loser is told either that checkout
 * already succeeded (returns the original order IDs) or that it's still
 * in flight, never left to double-place the order.
 */
async function acquireIdempotencyRecord(buyer: string, key: string) {
  try {
    return await CheckoutIdempotency.create({ buyer, key, status: "processing" });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;

    const existing = await CheckoutIdempotency.findOne({ buyer, key });
    if (!existing) {
      return await CheckoutIdempotency.create({ buyer, key, status: "processing" });
    }
    if (existing.status === "completed") {
      throw new DuplicateCompletedCheckoutError(existing.orderIds.map((id: unknown) => String(id)));
    }
    const age = Date.now() - existing.createdAt.getTime();
    if (age < STALE_PROCESSING_MS) {
      throw new CheckoutInProgressError();
    }
    // Abandoned mid-checkout (the process crashed) — safe to reclaim.
    await CheckoutIdempotency.deleteOne({ _id: existing._id });
    return await CheckoutIdempotency.create({ buyer, key, status: "processing" });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const {
      paymentMethod,
      deliveryAddress,
      deliveryBarangay,
      couponCode,
      buyNow,
      paymentReference,
      paymentProofImage,
      idempotencyKey,
    } = await req.json();

    if (!deliveryAddress || !deliveryBarangay) {
      return NextResponse.json({ message: "Please provide your delivery address." }, { status: 400 });
    }
    if (typeof idempotencyKey !== "string" || idempotencyKey.trim().length < 8) {
      return NextResponse.json({ message: "Missing or invalid request identifier." }, { status: 400 });
    }

    if (paymentMethod && paymentMethod !== "cod") {
      if (!paymentReference?.trim() || !paymentProofImage) {
        return NextResponse.json({ message: "Please provide a payment reference number and proof of payment." }, { status: 400 });
      }
      const imageError = invalidImageMessage(paymentProofImage, "Payment proof");
      if (imageError) {
        return NextResponse.json({ message: imageError }, { status: 400 });
      }
    }

    await connectToDatabase();

    const userId = session.user.id;

    const buyer = await User.findById(userId).select("emailVerified");
    if (!buyer?.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before placing an order.", requiresVerification: true },
        { status: 403 }
      );
    }

    let idempotencyRecord;
    try {
      idempotencyRecord = await acquireIdempotencyRecord(userId, idempotencyKey.trim());
    } catch (err) {
      if (err instanceof DuplicateCompletedCheckoutError) {
        return NextResponse.json({ message: "Order placed!", orderIds: err.orderIds }, { status: 200 });
      }
      if (err instanceof CheckoutInProgressError) {
        return NextResponse.json(
          { message: "Your order is already being processed — please wait a moment." },
          { status: 409 }
        );
      }
      throw err;
    }

    try {
      // "Buy Now" checks out a single product directly, bypassing the persistent basket.
      let cartItems: CheckoutCartItem[];
      if (buyNow?.productId) {
        const product = (await Product.findById(buyNow.productId)
          .populate("seller", "status")
          .lean()) as unknown as CheckoutProduct | null;
        cartItems = [{ product, quantity: Number(buyNow.quantity) || 1 }];
      } else {
        const rawItems = (await CartItem.find({ user: userId }).populate({
          path: "product",
          populate: { path: "seller", select: "status" },
        })) as unknown as { product: CheckoutProduct | null; quantity: number }[];
        cartItems = rawItems.map((i) => ({ product: i.product, quantity: i.quantity }));
      }

      if (cartItems.length === 0) {
        throw new CheckoutValidationError("Your basket is empty.");
      }

      for (const item of cartItems) {
        const validationError = validateCheckoutItem(item.product, item.quantity);
        if (validationError) {
          throw new CheckoutValidationError(validationError);
        }
      }

      // From here every item.product is known-valid and non-null.
      const items = cartItems as { product: CheckoutProduct; quantity: number }[];

      const bySeller = new Map<string, { product: CheckoutProduct; quantity: number }[]>();
      items.forEach((item) => {
        const sellerId = item.product.seller!._id.toString();
        if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
        bySeller.get(sellerId)!.push(item);
      });

      const cartSubtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      let appliedCoupon = null;
      let totalDiscount = 0;
      if (couponCode) {
        const result = await validateCoupon(couponCode, cartSubtotal);
        if (result.error) {
          throw new CheckoutValidationError(result.error);
        }
        appliedCoupon = result.coupon;
        totalDiscount = result.discount;
      }

      const mongoSession = await mongoose.startSession();
      const createdOrderIds: string[] = [];
      const sellerNotifications: { sellerId: string; orderId: string; total: number }[] = [];

      try {
        await mongoSession.withTransaction(async () => {
          createdOrderIds.length = 0;
          sellerNotifications.length = 0;

          // Atomically reserve stock for every item before creating any
          // order. The stock guard is checked and decremented in one
          // operation per product, so two concurrent checkouts can never
          // both pass a stale stock check and oversell the last units —
          // and because this all runs in one transaction, if anything
          // later in this function fails, every reservation made here is
          // rolled back automatically along with it.
          for (const item of items) {
            const updated = await Product.findOneAndUpdate(
              { _id: item.product._id, stock: { $gte: item.quantity } },
              { $inc: { stock: -item.quantity, soldCount: item.quantity } },
              { new: true, session: mongoSession }
            );
            if (!updated) {
              throw new CheckoutValidationError(`Not enough stock for "${item.product.name}".`);
            }
          }

          if (appliedCoupon) {
            const couponFilter: Record<string, unknown> = { _id: appliedCoupon._id };
            if (appliedCoupon.usageLimit) {
              couponFilter.usedCount = { $lt: appliedCoupon.usageLimit };
            }
            const couponUpdated = await Coupon.findOneAndUpdate(
              couponFilter,
              { $inc: { usedCount: 1 } },
              { session: mongoSession }
            );
            if (!couponUpdated) {
              throw new CheckoutValidationError("This coupon just reached its usage limit.");
            }
          }

          // Give the last group whatever discount remains, so rounding never leaves a stray centavo unassigned.
          const sellerEntries = Array.from(bySeller.entries());
          let discountAssigned = 0;

          for (let i = 0; i < sellerEntries.length; i++) {
            const [sellerId, sellerItems] = sellerEntries[i];
            const subtotal = sellerItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
            const feeOverrides = sellerItems
              .map((item) => item.product.deliveryFee)
              .filter((fee): fee is number => fee !== undefined && fee !== null);
            const deliveryFee = subtotal >= 500 ? 0 : feeOverrides.length > 0 ? Math.max(...feeOverrides) : 50;

            const isLast = i === sellerEntries.length - 1;
            const groupDiscount =
              totalDiscount === 0
                ? 0
                : isLast
                  ? Math.round((totalDiscount - discountAssigned) * 100) / 100
                  : Math.round((totalDiscount * (subtotal / cartSubtotal)) * 100) / 100;
            discountAssigned += groupDiscount;

            const total = subtotal + deliveryFee - groupDiscount;

            const [order] = await Order.create(
              [
                {
                  buyer: userId,
                  seller: sellerId,
                  items: sellerItems.map((item) => ({
                    product: item.product._id,
                    name: item.product.name,
                    price: item.product.price,
                    quantity: item.quantity,
                    unit: item.product.unit || "piece",
                    image: item.product.image,
                  })),
                  subtotal,
                  deliveryFee,
                  couponCode: appliedCoupon ? appliedCoupon.code : undefined,
                  discountAmount: groupDiscount,
                  total,
                  paymentMethod: paymentMethod || "cod",
                  deliveryAddress,
                  deliveryBarangay,
                  paymentReference: paymentMethod && paymentMethod !== "cod" ? paymentReference.trim() : undefined,
                  paymentProofImage: paymentMethod && paymentMethod !== "cod" ? paymentProofImage : undefined,
                },
              ],
              { session: mongoSession }
            );

            createdOrderIds.push(order._id.toString());
            sellerNotifications.push({ sellerId, orderId: order._id.toString(), total });
          }

          if (!buyNow?.productId) {
            await CartItem.deleteMany({ user: userId }, { session: mongoSession });
          }

          await CheckoutIdempotency.findByIdAndUpdate(
            idempotencyRecord._id,
            { $set: { status: "completed", orderIds: createdOrderIds } },
            { session: mongoSession }
          );
        });
      } finally {
        await mongoSession.endSession();
      }

      // Notifications are a post-commit side effect: the orders already
      // exist at this point, so a notification failure must never look
      // like a failed checkout to the buyer.
      for (const { sellerId, orderId, total } of sellerNotifications) {
        try {
          const sellerDoc = await Seller.findById(sellerId);
          if (sellerDoc) {
            await createNotification({
              userId: sellerDoc.user.toString(),
              type: "seller_new_order",
              title: "New order received!",
              body: `Order #${orderId.slice(-6).toUpperCase()} — ₱${total.toFixed(2)}`,
              link: `/seller/dashboard/orders/${orderId}`,
            });
          }
        } catch (notifyErr) {
          console.error("CHECKOUT NOTIFICATION ERROR:", notifyErr);
        }
      }

      return NextResponse.json({ message: "Order placed!", orderIds: createdOrderIds }, { status: 201 });
    } catch (err) {
      // Any failure after the idempotency record was created must clear
      // it, so a legitimate retry (same key, e.g. after the buyer fixes
      // a validation error) isn't blocked by a dead "processing" record.
      await CheckoutIdempotency.deleteOne({ _id: idempotencyRecord._id }).catch(() => {});
      if (err instanceof CheckoutValidationError) {
        return NextResponse.json({ message: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return NextResponse.json({ message: "Something went wrong during checkout." }, { status: 500 });
  }
}
