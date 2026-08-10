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

    await connectToDatabase();
    const seller = await Seller.findOne({ user: (session.user as any).id });
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const order = await Order.findOne({ _id: id, seller: seller._id });
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.paymentMethod === "cod") {
      return NextResponse.json({ message: "Cash on delivery orders don't need payment confirmation." }, { status: 400 });
    }
    if (order.paymentConfirmedAt) {
      return NextResponse.json({ message: "Payment already confirmed." }, { status: 400 });
    }

    order.paymentConfirmedAt = new Date();
    await order.save();

    await createNotification({
      userId: order.buyer.toString(),
      type: "order_status",
      title: "Payment confirmed",
      body: `The seller confirmed your payment for order #${order._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${order._id}`,
    });

    return NextResponse.json({ message: "Payment confirmed!", order });
  } catch (error) {
    console.error("CONFIRM PAYMENT ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
