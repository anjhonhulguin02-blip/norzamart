import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";

void User;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ orders: [] });
  }

  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session.user as any).id });
  if (!seller) {
    return NextResponse.json({ orders: [] });
  }

  const orders = await Order.find({ seller: seller._id })
    .populate("buyer", "name phone")
    .sort({ createdAt: -1 });

  return NextResponse.json({ orders });
}