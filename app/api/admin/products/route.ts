import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

void Seller;

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const products = await Product.find({}).populate("seller", "storeName").sort({ createdAt: -1 });
  return NextResponse.json({ products });
}