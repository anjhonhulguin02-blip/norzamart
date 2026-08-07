import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Conversation from "@/lib/models/conversation";
import Seller from "@/lib/models/seller";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { sellerId, productId } = await req.json();
    if (!sellerId) {
      return NextResponse.json({ message: "Missing seller." }, { status: 400 });
    }

    await connectToDatabase();

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return NextResponse.json({ message: "Seller not found." }, { status: 404 });
    }

    if (seller.user.toString() === (session.user as any).id) {
      return NextResponse.json({ message: "You cannot message your own store." }, { status: 400 });
    }

    let conversation = await Conversation.findOne({
      buyer: (session.user as any).id,
      seller: sellerId,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        buyer: (session.user as any).id,
        seller: sellerId,
        product: productId || undefined,
      });
    } else if (productId) {
      conversation.product = productId;
      await conversation.save();
    }

    return NextResponse.json({ conversationId: conversation._id.toString() });
  } catch (error) {
    console.error("CHAT START ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}