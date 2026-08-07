import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { validateCoupon } from "@/lib/validateCoupon";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { code, subtotal } = await req.json();
  await connectToDatabase();

  const result = await validateCoupon(code, Number(subtotal) || 0);
  if (result.error) {
    return NextResponse.json({ message: result.error }, { status: 400 });
  }

  return NextResponse.json({
    code: result.coupon.code,
    type: result.coupon.type,
    value: result.coupon.value,
    discount: result.discount,
  });
}
