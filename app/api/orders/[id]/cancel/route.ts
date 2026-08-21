import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";
import { restoreOrderStockOnce } from "@/lib/restoreOrderStock";
import {
  BUYER_INSTANT_CANCEL_FROM,
  BUYER_CANCEL_REQUEST_FROM,
  MAX_NOTE_LENGTH,
} from "@/lib/orderStateMachine";

class StaleOrderStatusError extends Error {}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason || "").trim();
    if (reason.length > MAX_NOTE_LENGTH) {
      return NextResponse.json(
        { message: `Please keep your reason under ${MAX_NOTE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const current = await Order.findOne({ _id: id, buyer: session.user.id });
    if (!current) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    const canInstantCancel = BUYER_INSTANT_CANCEL_FROM.includes(current.status);
    const canRequestCancel = BUYER_CANCEL_REQUEST_FROM.includes(current.status);

    if (!canInstantCancel && !canRequestCancel) {
      return NextResponse.json({ message: "This order can no longer be cancelled." }, { status: 400 });
    }

    if (canRequestCancel && !reason) {
      return NextResponse.json(
        { message: "Please tell the seller why you'd like to cancel." },
        { status: 400 }
      );
    }

    const update = canInstantCancel
      ? { $set: { status: "cancelled" }, $push: { statusHistory: { status: "cancelled", at: new Date() } } }
      : {
          $set: {
            status: "cancellation_requested",
            previousStatus: current.status,
            cancelReason: reason,
          },
          $push: { statusHistory: { status: "cancellation_requested", at: new Date() } },
        };

    const mongoSession = await mongoose.startSession();
    let updated: typeof current | null = null;
    try {
      await mongoSession.withTransaction(async () => {
        updated = await Order.findOneAndUpdate(
          { _id: id, buyer: session.user.id, status: current.status },
          update,
          { new: true, session: mongoSession }
        );
        if (!updated) {
          throw new StaleOrderStatusError();
        }
        if (canInstantCancel) {
          await restoreOrderStockOnce(updated._id, updated.items, mongoSession);
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
      await mongoSession.endSession();
    }

    if (!updated) {
      throw new Error("unreachable: transaction committed without setting `updated`");
    }
    const finalOrder: typeof current = updated;

    if (canRequestCancel) {
      const seller = await Seller.findById(finalOrder.seller);
      if (seller) {
        await createNotification({
          userId: seller.user.toString(),
          type: "order_status",
          title: "Buyer requested a cancellation",
          body: `Order #${finalOrder._id.toString().slice(-6).toUpperCase()} — ${reason}`,
          link: `/seller/dashboard/orders/${finalOrder._id}`,
        });
      }
      return NextResponse.json({ message: "Cancellation requested. The seller will review it shortly." });
    }

    return NextResponse.json({ message: "Order cancelled." });
  } catch (error) {
    console.error("ORDER CANCEL ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
