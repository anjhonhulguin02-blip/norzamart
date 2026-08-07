import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";

void Seller;
void User;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const orders = await Order.find({})
    .populate("buyer", "name")
    .populate("seller", "storeName")
    .sort({ createdAt: -1 })
    .limit(100);
  return NextResponse.json({ orders });
}