import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Follow from "@/lib/models/follow";
import Seller from "@/lib/models/seller";
import Product from "@/lib/models/product";

void Seller;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ stores: [] });
  }

  await connectToDatabase();
  const follows = await Follow.find({ user: (session.user as any).id })
    .populate("seller", "storeName storeLogo barangay status")
    .sort({ createdAt: -1 })
    .lean();

  const sellerIds = follows.map((f: any) => f.seller?._id).filter(Boolean);
  const productCounts = await Product.aggregate([
    { $match: { seller: { $in: sellerIds }, status: "active" } },
    { $group: { _id: "$seller", count: { $sum: 1 } } },
  ]);
  const countMap: Record<string, number> = {};
  productCounts.forEach((p: any) => { countMap[p._id.toString()] = p.count; });

  const stores = follows
    .filter((f: any) => f.seller)
    .map((f: any) => ({
      sellerId: f.seller._id.toString(),
      storeName: f.seller.storeName,
      storeLogo: f.seller.storeLogo,
      barangay: f.seller.barangay,
      status: f.seller.status,
      productCount: countMap[f.seller._id.toString()] || 0,
    }));

  return NextResponse.json({ stores });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { sellerId } = await req.json();
    if (!sellerId) {
      return NextResponse.json({ message: "Missing store." }, { status: 400 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;
    const existing = await Follow.findOne({ user: userId, seller: sellerId });

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      const followerCount = await Follow.countDocuments({ seller: sellerId });
      return NextResponse.json({ following: false, followerCount });
    }

    await Follow.create({ user: userId, seller: sellerId });
    const followerCount = await Follow.countDocuments({ seller: sellerId });
    return NextResponse.json({ following: true, followerCount }, { status: 201 });
  } catch (error) {
    console.error("FOLLOW TOGGLE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
