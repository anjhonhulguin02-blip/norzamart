import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import { validateCoupon } from "@/lib/validateCoupon";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { allowed, retryAfterMs } = await checkRateLimit(`coupon:${(session.user as any).id}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return NextResponse.json({ message: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
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
