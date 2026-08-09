import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { action, note } = await req.json();
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action." }, { status: 400 });
    }

    await connectToDatabase();
    const seller = await Seller.findOne({ user: (session.user as any).id });
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const order = await Order.findOne({ _id: id, seller: seller._id });
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (!["cancellation_requested", "refund_requested"].includes(order.status)) {
      return NextResponse.json({ message: "This order has no pending request to resolve." }, { status: 400 });
    }

    const requestType = order.status as "cancellation_requested" | "refund_requested";
    const labels = RESOLUTION_LABELS[requestType];

    if (action === "approve") {
      const finalStatus = requestType === "cancellation_requested" ? "cancelled" : "refunded";
      order.status = finalStatus;
      order.statusHistory.push({ status: finalStatus, at: new Date() });

      if (finalStatus === "cancelled") {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }
      }
    } else {
      const revertStatus = order.previousStatus || "delivered";
      order.status = revertStatus;
      order.statusHistory.push({ status: revertStatus, at: new Date() });
    }

    order.resolutionNote = (note || "").trim() || undefined;
    order.previousStatus = undefined;
    await order.save();

    await createNotification({
      userId: order.buyer.toString(),
      type: "order_status",
      title: action === "approve" ? labels.approved : labels.rejected,
      body: order.resolutionNote || `Order #${order._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${order._id}`,
    });

    return NextResponse.json({ message: "Resolved!", order });
  } catch (error) {
    console.error("ORDER RESOLVE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
