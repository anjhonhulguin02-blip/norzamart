import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const sellers = await Seller.find({}).select("-governmentId").sort({ createdAt: -1 });
  return NextResponse.json({ sellers });
}