import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/lib/models/category";
import { requireAdmin } from "@/lib/requireAdmin";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  await connectToDatabase();
  const category = await Category.findByIdAndDelete(id);

  if (!category) {
    return NextResponse.json({ message: "Category not found." }, { status: 404 });
  }

  return NextResponse.json({ message: "Category deleted." });
}
