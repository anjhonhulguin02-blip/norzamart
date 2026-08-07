import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/lib/models/coupon";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return NextResponse.json({ coupons });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { code, type, value, minSpend, maxDiscount, expiresAt, usageLimit } = await req.json();

  if (!code?.trim() || !type || value === undefined || value === "") {
    return NextResponse.json({ message: "Code, type, and value are required." }, { status: 400 });
  }
  if (!["percent", "fixed"].includes(type)) {
    return NextResponse.json({ message: "Invalid coupon type." }, { status: 400 });
  }
  if (type === "percent" && (Number(value) <= 0 || Number(value) > 100)) {
    return NextResponse.json({ message: "Percent value must be between 1 and 100." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      type,
      value: Number(value),
      minSpend: minSpend ? Number(minSpend) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      expiresAt: expiresAt || undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
    });
    return NextResponse.json({ message: "Coupon created!", coupon }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "That coupon code already exists." }, { status: 409 });
    }
    console.error("COUPON CREATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
