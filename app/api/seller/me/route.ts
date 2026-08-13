import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isSeller: false }, { status: 200 });
  }

  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session.user as any).id }).select("-governmentId");

  return NextResponse.json({ isSeller: !!seller, seller: seller || null });
}