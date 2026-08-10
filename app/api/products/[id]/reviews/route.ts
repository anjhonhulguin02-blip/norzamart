import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Review from "@/lib/models/review";
import Order from "@/lib/models/order";
import { invalidImageArrayMessage } from "@/lib/validateImageUrl";
import { checkRateLimit } from "@/lib/rateLimit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const myUserId = session?.user ? (session.user as any).id : null;

  await connectToDatabase();

  const reviews = await Review.find({ product: id }).sort({ createdAt: -1 }).lean() as any[];
  const average = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const withLikes = reviews.map((r: any) => ({
    ...r,
    likeCount: (r.likedBy || []).length,
    likedByMe: myUserId ? (r.likedBy || []).some((u: any) => u.toString() === myUserId) : false,
    likedBy: undefined,
  }));

  return NextResponse.json({ reviews: withLikes, average, count: reviews.length });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in to leave a review." }, { status: 401 });
    }

    const { allowed, retryAfterMs } = await checkRateLimit(`review:${(session.user as any).id}`, 10, 60 * 60 * 1000);
    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60000);
      return NextResponse.json({ message: `You're posting reviews too quickly. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` }, { status: 429 });
    }

    const { rating, comment, images } = await req.json();
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ message: "Please select a rating." }, { status: 400 });
    }

    const imageError = invalidImageArrayMessage(images, "Review photos");
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectToDatabase();

    const userId = (session.user as any).id;

    const existingReview = await Review.findOne({ product: id, user: userId });
    if (existingReview) {
      return NextResponse.json({ message: "You've already reviewed this product." }, { status: 400 });
    }

    const hasDeliveredOrder = await Order.exists({
      buyer: userId,
      status: "delivered",
      "items.product": id,
    });
    if (!hasDeliveredOrder) {
      return NextResponse.json(
        { message: "You can only review products from an order that's been delivered to you." },
        { status: 403 }
      );
    }

    const review = await Review.create({
      product: id,
      user: userId,
      userName: session.user.name || "Customer",
      rating,
      comment,
      images,
      verifiedPurchase: true,
    });

    return NextResponse.json({ message: "Review posted!", review }, { status: 201 });
  } catch (error) {
    console.error("REVIEW POST ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}