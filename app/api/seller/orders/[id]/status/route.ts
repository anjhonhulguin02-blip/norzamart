import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

const FLOW = ["pending", "accepted", "preparing", "packed", "out_for_delivery", "delivered"];

const STATUS_LABELS: Record<string, string> = {
  accepted: "Your order was accepted",
  preparing: "Your order is being prepared",
  packed: "Your order has been packed",
  out_for_delivery: "Your order is out for delivery",
  delivered: "Your order has been delivered",
  cancelled: "Your order was cancelled",
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { status } = await req.json();
    if (!status || (!FLOW.includes(status) && status !== "cancelled")) {
      return NextResponse.json({ message: "Invalid status." }, { status: 400 });
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

    if (["delivered", "cancelled", "refunded", "cancellation_requested", "refund_requested"].includes(order.status)) {
      return NextResponse.json({ message: "This order can no longer be updated." }, { status: 400 });
    }

    if (status !== "cancelled" && order.paymentMethod !== "cod" && !order.paymentConfirmedAt) {
      return NextResponse.json({ message: "Please confirm payment was received before updating this order." }, { status: 400 });
    }

    if (status === "cancelled") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }

    order.status = status;
    order.statusHistory.push({ status, at: new Date() });
    await order.save();

    await createNotification({
      userId: order.buyer.toString(),
      type: "order_status",
      title: STATUS_LABELS[status] || "Order updated",
      body: `Order #${order._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${order._id}`,
    });

    return NextResponse.json({ message: "Order updated!", order });
  } catch (error) {
    console.error("ORDER STATUS UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}