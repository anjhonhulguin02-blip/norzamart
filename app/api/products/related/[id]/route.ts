import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

void Seller;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();

  const current = await Product.findById(id);
  if (!current) {
    return NextResponse.json({ products: [] });
  }

  const related = await Product.find({
    _id: { $ne: id },
    category: current.category,
    status: "active",
    approvalStatus: "approved",
  })
    .populate("seller", "storeName barangay")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return NextResponse.json({
    products: related.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image || "🛒",
      unit: p.unit || "piece",
      brgy: p.seller?.barangay || "",
    })),
  });
}