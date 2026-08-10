import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CartItem from "@/lib/models/cart";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import Coupon from "@/lib/models/coupon";
import User from "@/lib/models/user";
import { createNotification } from "@/lib/createNotification";
import { validateCoupon } from "@/lib/validateCoupon";
import { invalidImageMessage } from "@/lib/validateImageUrl";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { paymentMethod, deliveryAddress, deliveryBarangay, couponCode, buyNow, paymentReference, paymentProofImage } = await req.json();
    if (!deliveryAddress || !deliveryBarangay) {
      return NextResponse.json({ message: "Please provide your delivery address." }, { status: 400 });
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

    const userId = (session.user as any).id;

    const buyer = await User.findById(userId).select("emailVerified");
    if (!buyer?.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before placing an order.", requiresVerification: true },
        { status: 403 }
      );
    }

    // "Buy Now" checks out a single product directly, bypassing the persistent basket.
    let cartItems: { product: any; quantity: number }[];
    if (buyNow?.productId) {
      const product = await Product.findById(buyNow.productId);
      if (!product || product.status !== "active" || product.approvalStatus !== "approved") {
        return NextResponse.json({ message: "This product is no longer available." }, { status: 400 });
      }
      cartItems = [{ product, quantity: Math.max(1, Number(buyNow.quantity) || 1) }];
    } else {
      cartItems = await CartItem.find({ user: userId }).populate("product");
    }

    if (cartItems.length === 0) {
      return NextResponse.json({ message: "Your basket is empty." }, { status: 400 });
    }

    // Atomically reserve stock for every item before creating any order. Using
    // findOneAndUpdate with a stock guard (rather than a separate read-then-write)
    // prevents two concurrent checkouts from both passing a stale stock check and
    // overselling the last units of a product.
    const reserved: { productId: string; quantity: number }[] = [];
    const rollbackReserved = async () => {
      for (const r of reserved) {
        await Product.findByIdAndUpdate(r.productId, { $inc: { stock: r.quantity, soldCount: -r.quantity } });
      }
    };

    for (const item of cartItems) {
      const product = item.product as any;
      if (!product) {
        await rollbackReserved();
        return NextResponse.json({ message: "A product in your basket is no longer available." }, { status: 400 });
      }

      const updated = await Product.findOneAndUpdate(
        { _id: product._id, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity, soldCount: item.quantity } },
        { new: true }
      );

      if (!updated) {
        await rollbackReserved();
        return NextResponse.json(
          { message: `Not enough stock for "${product.name}".` },
          { status: 400 }
        );
      }

      reserved.push({ productId: product._id.toString(), quantity: item.quantity });
    }

    // Group cart items by seller
    const bySeller = new Map<string, typeof cartItems>();
    cartItems.forEach((item) => {
      const sellerId = (item.product as any).seller.toString();
      if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
      bySeller.get(sellerId)!.push(item);
    });

    // Validate the coupon (if any) against the whole cart, then split its discount
    // proportionally across each seller's sub-order based on their share of the subtotal.
    const cartSubtotal = cartItems.reduce(
      (sum, item) => sum + (item.product as any).price * item.quantity, 0
    );

    let appliedCoupon = null;
    let totalDiscount = 0;
    if (couponCode) {
      const result = await validateCoupon(couponCode, cartSubtotal);
      if (result.error) {
        await rollbackReserved();
        return NextResponse.json({ message: result.error }, { status: 400 });
      }
      appliedCoupon = result.coupon;
      totalDiscount = result.discount;
    }

    const createdOrders = [];

    try {
      const sellerEntries = Array.from(bySeller.entries());
      let discountAssigned = 0;

      for (let i = 0; i < sellerEntries.length; i++) {
        const [sellerId, items] = sellerEntries[i];
        const subtotal = items.reduce((sum, item) => sum + (item.product as any).price * item.quantity, 0);
        const feeOverrides = items
          .map((item) => (item.product as any).deliveryFee)
          .filter((fee) => fee !== undefined && fee !== null);
        const deliveryFee = subtotal >= 500 ? 0 : feeOverrides.length > 0 ? Math.max(...feeOverrides) : 50;

        // Give the last group whatever discount remains, so rounding never leaves a stray centavo unassigned.
        const isLast = i === sellerEntries.length - 1;
        const groupDiscount = totalDiscount === 0 ? 0 : isLast
          ? Math.round((totalDiscount - discountAssigned) * 100) / 100
          : Math.round((totalDiscount * (subtotal / cartSubtotal)) * 100) / 100;
        discountAssigned += groupDiscount;

        const total = subtotal + deliveryFee - groupDiscount;

        const order = await Order.create({
          buyer: userId,
          seller: sellerId,
          items: items.map((item) => ({
            product: (item.product as any)._id,
            name: (item.product as any).name,
            price: (item.product as any).price,
            quantity: item.quantity,
            unit: (item.product as any).unit || "piece",
            image: (item.product as any).image,
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
        });

        createdOrders.push(order._id.toString());

        const sellerDoc = await Seller.findById(sellerId);
        if (sellerDoc) {
          await createNotification({
            userId: sellerDoc.user.toString(),
            type: "seller_new_order",
            title: "New order received!",
            body: `Order #${order._id.toString().slice(-6).toUpperCase()} — ₱${total.toFixed(2)}`,
            link: `/seller/dashboard/orders/${order._id}`,
          });
        }
      }
    } catch (err) {
      // Stock was already reserved atomically above; if order creation fails partway,
      // put it back rather than leaving stock decremented with no order to show for it.
      await rollbackReserved();
      throw err;
    }

    if (!buyNow?.productId) {
      await CartItem.deleteMany({ user: userId });
    }

    if (appliedCoupon) {
      await Coupon.findByIdAndUpdate(appliedCoupon._id, { $inc: { usedCount: 1 } });
    }

    return NextResponse.json({ message: "Order placed!", orderIds: createdOrders }, { status: 201 });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    return NextResponse.json({ message: "Something went wrong during checkout." }, { status: 500 });
  }
}