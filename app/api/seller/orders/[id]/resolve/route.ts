import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { requireApprovedSeller } from "@/lib/getSellerFromSession";
import { createNotification } from "@/lib/createNotification";
import { restoreOrderStockOnce } from "@/lib/restoreOrderStock";
import { RESOLVABLE_STATUSES, MAX_NOTE_LENGTH } from "@/lib/orderStateMachine";

const RESOLUTION_LABELS: Record<string, { approved: string; rejected: string }> = {
  cancellation_requested: {
    approved: "Your cancellation was approved",
    rejected: "Your cancellation request was declined",
  },
  refund_requested: {
    approved: "Your refund was approved",
    rejected: "Your refund request was declined",
  },
};

class StaleOrderStatusError extends Error {}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await requireApprovedSeller();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const { action, note } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }
    const trimmedNote = (note || "").trim();
    if (trimmedNote.length > MAX_NOTE_LENGTH) {
      return NextResponse.json(
        { message: `Please keep your note under ${MAX_NOTE_LENGTH} characters.` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const current = await Order.findOne({ _id: id, seller: seller._id });
    if (!current) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (!RESOLVABLE_STATUSES.includes(current.status)) {
      return NextResponse.json({ message: "This order has no pending request to resolve." }, { status: 400 });
    }

    const requestType = current.status as "cancellation_requested" | "refund_requested";
    const labels = RESOLUTION_LABELS[requestType];

    const finalStatus =
      action === "approve"
        ? requestType === "cancellation_requested"
          ? "cancelled"
          : "refunded"
        : current.previousStatus || "delivered";

    const mongoSession = await mongoose.startSession();
    let updated: typeof current | null = null;
    try {
      await mongoSession.withTransaction(async () => {
        updated = await Order.findOneAndUpdate(
          { _id: id, seller: seller._id, status: current.status },
          {
            $set: { status: finalStatus, resolutionNote: trimmedNote || undefined, previousStatus: undefined },
            $push: { statusHistory: { status: finalStatus, at: new Date() } },
          },
          { new: true, session: mongoSession }
        );
        if (!updated) {
          throw new StaleOrderStatusError();
        }
        if (action === "approve" && requestType === "cancellation_requested") {
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

    await createNotification({
      userId: finalOrder.buyer.toString(),
      type: "order_status",
      title: action === "approve" ? labels.approved : labels.rejected,
      body: trimmedNote || `Order #${finalOrder._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${finalOrder._id}`,
    });

    return NextResponse.json({ message: "Resolved!", order: finalOrder });
  } catch (error) {
    console.error("ORDER RESOLVE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
