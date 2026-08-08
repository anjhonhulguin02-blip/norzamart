import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [], stores: [] });
  }

  await connectToDatabase();
  const [products, stores] = await Promise.all([
    Product.find({
      status: "active",
      approvalStatus: "approved",
      name: { $regex: q, $options: "i" },
    })
      .select("name image price unit")
      .limit(6)
      .lean(),
    Seller.find({ storeName: { $regex: q, $options: "i" } })
      .select("storeName storeLogo barangay status")
      .limit(4)
      .lean(),
  ]);

  return NextResponse.json({ suggestions: products, stores });
}
