import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";

void Seller;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ orders: [] });
  }

  await connectToDatabase();
  const orders = await Order.find({ buyer: (session.user as any).id })
    .populate("seller", "storeName storeLogo")
    .sort({ createdAt: -1 });

  return NextResponse.json({ orders });
}