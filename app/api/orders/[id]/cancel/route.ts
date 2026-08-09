import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";
import { createNotification } from "@/lib/createNotification";

const REQUESTABLE_STATUSES = ["accepted", "preparing", "packed", "out_for_delivery"];

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = (body?.reason || "").trim();

    await connectToDatabase();
    const order = await Order.findOne({ _id: id, buyer: (session.user as any).id });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.status === "pending") {
      order.status = "cancelled";
      order.statusHistory.push({ status: "cancelled", at: new Date() });
      await order.save();

      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }

      return NextResponse.json({ message: "Order cancelled." });
    }

    if (REQUESTABLE_STATUSES.includes(order.status)) {
      if (!reason) {
        return NextResponse.json({ message: "Please tell the seller why you'd like to cancel." }, { status: 400 });
      }

      order.previousStatus = order.status;
      order.cancelReason = reason;
      order.status = "cancellation_requested";
      order.statusHistory.push({ status: "cancellation_requested", at: new Date() });
      await order.save();

      const seller = await Seller.findById(order.seller);
      if (seller) {
        await createNotification({
          userId: seller.user.toString(),
          type: "order_status",
          title: "Buyer requested a cancellation",
          body: `Order #${order._id.toString().slice(-6).toUpperCase()} — ${reason}`,
          link: `/seller/dashboard/orders/${order._id}`,
        });
      }

      return NextResponse.json({ message: "Cancellation requested. The seller will review it shortly." });
    }

    return NextResponse.json({ message: "This order can no longer be cancelled." }, { status: 400 });
  } catch (error) {
    console.error("ORDER CANCEL ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}