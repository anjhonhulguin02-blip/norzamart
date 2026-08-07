import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/lib/models/coupon";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const coupons = await Coupon.find({
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
  }).sort({ createdAt: -1 });

  const available = coupons.filter((c) => !c.usageLimit || c.usedCount < c.usageLimit);

  return NextResponse.json({ coupons: available });
}
