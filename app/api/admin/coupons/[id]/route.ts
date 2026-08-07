import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Coupon from "@/lib/models/coupon";
import { requireAdmin } from "@/lib/requireAdmin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const { active } = await req.json();

  await connectToDatabase();
  const coupon = await Coupon.findByIdAndUpdate(id, { active }, { new: true });

  if (!coupon) {
    return NextResponse.json({ message: "Coupon not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Coupon updated!", coupon });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    return NextResponse.json({ message: "Coupon not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Coupon deleted." });
}
