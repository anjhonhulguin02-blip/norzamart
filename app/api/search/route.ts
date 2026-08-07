import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  await connectToDatabase();
  const products = await Product.find({
    status: "active",
    name: { $regex: q, $options: "i" },
  })
    .select("name image price unit")
    .limit(6)
    .lean();

  return NextResponse.json({ suggestions: products });
}