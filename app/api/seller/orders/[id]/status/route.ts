import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { requireApprovedSeller } from "@/lib/getSellerFromSession";
import { createNotification } from "@/lib/createNotification";
import { restoreOrderStockOnce } from "@/lib/restoreOrderStock";
import { isValidSellerAdvance, SELLER_CANCELLABLE_FROM } from "@/lib/orderStateMachine";

const STATUS_LABELS: Record<string, string> = {
  accepted: "Your order was accepted",
  preparing: "Your order is being prepared",
  packed: "Your order has been packed",
  out_for_delivery: "Your order is out for delivery",
  delivered: "Your order has been delivered",
  cancelled: "Your order was cancelled",
};

class StaleOrderStatusError extends Error {}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await requireApprovedSeller();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const { status } = await req.json();
    if (typeof status !== "string") {
      return NextResponse.json({ message: "Invalid status." }, { status: 400 });
    }

    await connectToDatabase();

    const current = await Order.findOne({ _id: id, seller: seller._id });
    if (!current) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const isAdvance = isValidSellerAdvance(current.status, status);
    const isCancel = status === "cancelled" && SELLER_CANCELLABLE_FROM.includes(current.status);
    if (!isAdvance && !isCancel) {
      return NextResponse.json(
        { message: "This order can't be moved to that status right now." },
        { status: 400 }
      );
    }

    if (status !== "cancelled" && current.paymentMethod !== "cod" && !current.paymentConfirmedAt) {
      return NextResponse.json(
        { message: "Please confirm payment was received before updating this order." },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    let updated: typeof current | null = null;
    try {
      await session.withTransaction(async () => {
        updated = await Order.findOneAndUpdate(
          { _id: id, seller: seller._id, status: current.status },
          { $set: { status }, $push: { statusHistory: { status, at: new Date() } } },
          { new: true, session }
        );
        if (!updated) {
          throw new StaleOrderStatusError();
        }
        if (status === "cancelled") {
          await restoreOrderStockOnce(updated._id, updated.items, session);
        }
      });
    } catch (err) {
      if (err instanceof StaleOrderStatusError) {
        return NextResponse.json(
          { message: "This order was already updated — please refresh." },
          { status: 409 }
        );
      }
      throw err;
    } finally {
      await session.endSession();
    }

    if (!updated) {
      throw new Error("unreachable: transaction committed without setting `updated`");
    }
    const finalOrder: typeof current = updated;

    await createNotification({
      userId: finalOrder.buyer.toString(),
      type: "order_status",
      title: STATUS_LABELS[status] || "Order updated",
      body: `Order #${finalOrder._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${finalOrder._id}`,
    });

    return NextResponse.json({ message: "Order updated!", order: finalOrder });
  } catch (error) {
    console.error("ORDER STATUS UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
