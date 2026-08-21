import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";
import { BUYER_REFUND_REQUEST_FROM, MAX_NOTE_LENGTH } from "@/lib/orderStateMachine";

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
    if (!reason) {
      return NextResponse.json({ message: "Please tell the seller why you'd like a refund." }, { status: 400 });
    }
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

    if (!BUYER_REFUND_REQUEST_FROM.includes(current.status)) {
      return NextResponse.json({ message: "Only delivered orders can be refunded." }, { status: 400 });
    }

    const mongoSession = await mongoose.startSession();
    let updated: typeof current | null = null;
    try {
      await mongoSession.withTransaction(async () => {
        updated = await Order.findOneAndUpdate(
          { _id: id, buyer: session.user.id, status: current.status },
          {
            $set: { status: "refund_requested", previousStatus: current.status, refundReason: reason },
            $push: { statusHistory: { status: "refund_requested", at: new Date() } },
          },
          { new: true, session: mongoSession }
        );
        if (!updated) {
          throw new StaleOrderStatusError();
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

    const seller = await Seller.findById(finalOrder.seller);
    if (seller) {
      await createNotification({
        userId: seller.user.toString(),
        type: "order_status",
        title: "Buyer requested a refund",
        body: `Order #${finalOrder._id.toString().slice(-6).toUpperCase()} — ${reason}`,
        link: `/seller/dashboard/orders/${finalOrder._id}`,
      });
    }

    return NextResponse.json({ message: "Refund requested. The seller will review it shortly." });
  } catch (error) {
    console.error("ORDER REFUND REQUEST ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
