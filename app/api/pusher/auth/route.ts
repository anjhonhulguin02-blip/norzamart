import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Conversation from "@/lib/models/conversation";
import Seller from "@/lib/models/seller";
import { pusherServer } from "@/lib/pusherServer";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const formData = await req.formData();
  const socketId = formData.get("socket_id") as string;
  const channel = formData.get("channel_name") as string;

  if (!socketId || !channel) {
    return NextResponse.json({ message: "Missing socket_id or channel_name." }, { status: 400 });
  }

  // private-user-<userId>: only that user may subscribe to their own notification channel.
  if (channel === `private-user-${userId}`) {
    const auth = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  }

  // private-conversation-<conversationId>: only the buyer or the owning seller may subscribe.
  const conversationMatch = channel.match(/^private-conversation-(.+)$/);
  if (conversationMatch) {
    await connectToDatabase();
    const conversation = await Conversation.findById(conversationMatch[1]);
    if (!conversation) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
    const isBuyer = conversation.buyer.toString() === userId;
    const seller = isBuyer ? null : await Seller.findOne({ user: userId });
    const isSeller = !!seller && conversation.seller.toString() === seller._id.toString();
    if (!isBuyer && !isSeller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }
    const auth = pusherServer.authorizeChannel(socketId, channel);
    return NextResponse.json(auth);
  }

  return NextResponse.json({ message: "Not authorized." }, { status: 403 });
}
