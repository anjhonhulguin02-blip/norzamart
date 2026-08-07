import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Category from "@/lib/models/category";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  await connectToDatabase();
  const categories = await Category.find().sort({ name: 1 });
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { name, icon } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ message: "Category name is required." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const category = await Category.create({ name: name.trim(), icon: icon?.trim() || "📦" });
    return NextResponse.json({ message: "Category added!", category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "That category already exists." }, { status: 409 });
    }
    console.error("CATEGORY CREATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
