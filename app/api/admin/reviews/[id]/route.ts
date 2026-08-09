import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/lib/models/review";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();
  const review = await Review.findByIdAndDelete(id);
  if (!review) return NextResponse.json({ message: "Review not found." }, { status: 404 });

  return NextResponse.json({ message: "Review removed." });
}
