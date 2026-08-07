import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { status } = await req.json();
  if (!["active", "inactive"].includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  await connectToDatabase();
  const product = await Product.findByIdAndUpdate(id, { status }, { new: true });
  if (!product) return NextResponse.json({ message: "Product not found." }, { status: 404 });

  return NextResponse.json({ message: "Updated!", product });
}