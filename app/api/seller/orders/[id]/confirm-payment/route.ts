import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import { requireApprovedSeller } from "@/lib/getSellerFromSession";
import { createNotification } from "@/lib/createNotification";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await requireApprovedSeller();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    await connectToDatabase();

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

    const updated = await Order.findOneAndUpdate(
      { _id: id, seller: seller._id, paymentConfirmedAt: { $exists: false } },
      { $set: { paymentConfirmedAt: new Date() } },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ message: "Payment already confirmed." }, { status: 400 });
    }

    await createNotification({
      userId: updated.buyer.toString(),
      type: "order_status",
      title: "Payment confirmed",
      body: `The seller confirmed your payment for order #${updated._id.toString().slice(-6).toUpperCase()}`,
      link: `/dashboard/orders/${updated._id}`,
    });

    return NextResponse.json({ message: "Payment confirmed!", order: updated });
  } catch (error) {
    console.error("CONFIRM PAYMENT ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
