import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";

void User;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const order = await Order.findById(id)
    .populate("seller", "storeName storeLogo barangay")
    .populate("buyer", "name phone");

  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }

  const userId = (session.user as any).id;
  const isBuyer = order.buyer._id.toString() === userId;

  let isSeller = false;
  if (!isBuyer) {
    const seller = await Seller.findOne({ user: userId });
    isSeller = !!seller && order.seller._id.toString() === seller._id.toString();
  }

  if (!isBuyer && !isSeller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 403 });
  }

  return NextResponse.json({ order });
}