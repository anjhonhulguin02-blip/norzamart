import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/lib/models/review";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();

  const reviews = await Review.find({ product: id }).sort({ createdAt: -1 });
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return NextResponse.json({ reviews, average, count: reviews.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to leave a review." }, { status: 401 });
    }

    const { rating, comment } = await req.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Please select a rating." }, { status: 400 });
    }

    await connectToDatabase();
    const review = await Review.create({
      product: id,
      user: (session.user as any).id,
      userName: session.user.name || "Customer",
      rating,
      comment,
    });

    return NextResponse.json({ message: "Review posted!", review }, { status: 201 });
  } catch (error) {
    console.error("REVIEW POST ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}