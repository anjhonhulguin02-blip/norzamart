import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

void Seller;

export async function POST(req: Request) {
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ products: [] });
  }

  await connectToDatabase();
  const products = await Product.find({ _id: { $in: ids }, status: "active" })
    .populate("seller", "storeName barangay")
    .lean();

  return NextResponse.json({ products });
}