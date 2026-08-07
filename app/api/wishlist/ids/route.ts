import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Wishlist from "@/lib/models/wishlist";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ids: [] });
  }

  await connectToDatabase();
  const items = await Wishlist.find({ user: (session.user as any).id }).select("product");
  return NextResponse.json({ ids: items.map((i) => i.product.toString()) });
}