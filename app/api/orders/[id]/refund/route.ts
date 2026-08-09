import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

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

    await connectToDatabase();
    const order = await Order.findOne({ _id: id, buyer: (session.user as any).id });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.status !== "delivered") {
      return NextResponse.json({ message: "Only delivered orders can be refunded." }, { status: 400 });
    }

    order.previousStatus = order.status;
    order.refundReason = reason;
    order.status = "refund_requested";
    order.statusHistory.push({ status: "refund_requested", at: new Date() });
    await order.save();

    const seller = await Seller.findById(order.seller);
    if (seller) {
      await createNotification({
        userId: seller.user.toString(),
        type: "order_status",
        title: "Buyer requested a refund",
        body: `Order #${order._id.toString().slice(-6).toUpperCase()} — ${reason}`,
        link: `/seller/dashboard/orders/${order._id}`,
      });
    }

    return NextResponse.json({ message: "Refund requested. The seller will review it shortly." });
  } catch (error) {
    console.error("ORDER REFUND REQUEST ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
