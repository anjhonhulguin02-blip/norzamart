import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/lib/models/review";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const reviews = await Review.find({})
    .sort({ createdAt: -1 })
    .limit(200)
    .populate("product", "name")
    .lean();

  return NextResponse.json({ reviews });
}
