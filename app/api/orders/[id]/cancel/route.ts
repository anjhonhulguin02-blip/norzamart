import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ _id: id, buyer: (session.user as any).id });

    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json({ message: "This order can no longer be cancelled." }, { status: 400 });
    }

    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", at: new Date() });
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
    }

    return NextResponse.json({ message: "Order cancelled." });
  } catch (error) {
    console.error("ORDER CANCEL ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}