import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Wishlist from "@/lib/models/wishlist";
import Seller from "@/lib/models/seller";

void Seller;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ items: [] });
  }

  await connectToDatabase();
  const items = await Wishlist.find({ user: (session.user as any).id })
    .populate({ path: "product", populate: { path: "seller", select: "storeName barangay" } })
    .sort({ createdAt: -1 });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "Missing product." }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Wishlist.findOne({ user: (session.user as any).id, product: productId });
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      return NextResponse.json({ wishlisted: false });
    }

    await Wishlist.create({ user: (session.user as any).id, product: productId });
    return NextResponse.json({ wishlisted: true }, { status: 201 });
  } catch (error) {
    console.error("WISHLIST TOGGLE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}