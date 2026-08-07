import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Payout from "@/lib/models/payout";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  const payouts = await Payout.find()
    .populate("seller", "storeName")
    .sort({ createdAt: -1 });

  return NextResponse.json({ payouts });
}
