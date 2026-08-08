import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/lib/models/review";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    await connectToDatabase();
    const userId = (session.user as any).id;

    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ message: "Review not found." }, { status: 404 });
    }

    const alreadyLiked = review.likedBy.some((u: any) => u.toString() === userId);
    if (alreadyLiked) {
      review.likedBy = review.likedBy.filter((u: any) => u.toString() !== userId);
    } else {
      review.likedBy.push(userId);
    }
    await review.save();

    return NextResponse.json({ liked: !alreadyLiked, likeCount: review.likedBy.length });
  } catch (error) {
    console.error("REVIEW LIKE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
