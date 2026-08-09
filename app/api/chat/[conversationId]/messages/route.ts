import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Conversation from "@/lib/models/conversation";
import Message from "@/lib/models/message";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";
import { createNotification } from "@/lib/createNotification";
import { pusherServer } from "@/lib/pusherServer";

void User;

async function resolveAccess(conversationId: string, userId: string) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return null;

  if (conversation.buyer.toString() === userId) {
    return { conversation, role: "buyer" as const };
  }

  const seller = await Seller.findOne({ user: userId });
  if (seller && conversation.seller.toString() === seller._id.toString()) {
    return { conversation, role: "seller" as const };
  }

  return null;
}

export async function GET(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const access = await resolveAccess(conversationId, (session.user as any).id);
  if (!access) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const { conversation, role } = access;

  // Mark the other person's messages as seen, and reset my unread count
  await Message.updateMany(
    { conversation: conversationId, sender: { $ne: (session.user as any).id }, seen: false },
    { $set: { seen: true } }
  );

  if (role === "buyer" && conversation.buyerUnread !== 0) {
    conversation.buyerUnread = 0;
    await conversation.save();
  } else if (role === "seller" && conversation.sellerUnread !== 0) {
    conversation.sellerUnread = 0;
    await conversation.save();
  }

  const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });

  const populatedConversation = await Conversation.findById(conversationId)
    .populate("buyer", "name avatar")
    .populate({ path: "seller", select: "storeName storeLogo user", populate: { path: "user", select: "_id" } });

  return NextResponse.json({ messages, conversation: populatedConversation });
}

export async function POST(req: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const { conversationId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { text, image } = await req.json();
    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!trimmedText && !image) {
      return NextResponse.json({ message: "Message cannot be empty." }, { status: 400 });
    }

    await connectToDatabase();
    const access = await resolveAccess(conversationId, (session.user as any).id);
    if (!access) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }

    const { conversation, role } = access;

    const message = await Message.create({
      conversation: conversationId,
      sender: (session.user as any).id,
      senderName: session.user.name || "User",
      text: trimmedText,
      image: image || undefined,
      seen: false,
    });

    const previewText = trimmedText || "📷 Photo";
    conversation.lastMessage = previewText;
    conversation.lastMessageAt = new Date();

    // Increment unread count for whoever DIDN'T send this message
    if (role === "buyer") {
      conversation.sellerUnread = (conversation.sellerUnread || 0) + 1;
    } else {
      conversation.buyerUnread = (conversation.buyerUnread || 0) + 1;
    }

    await conversation.save();

    await pusherServer.trigger(`private-conversation-${conversationId}`, "message", message);

    // Notify the recipient (the person who did NOT send this message)
    let recipientUserId: string;
    if (role === "buyer") {
      const sellerDoc = await Seller.findById(conversation.seller);
      recipientUserId = sellerDoc?.user?.toString() || "";
    } else {
      recipientUserId = conversation.buyer.toString();
    }
    if (recipientUserId) {
      await createNotification({
        userId: recipientUserId,
        type: "new_message",
        title: "New message",
        body: previewText.slice(0, 80),
        link: `/messages/${conversationId}`,
      });
    }

    return NextResponse.json({ message: "Sent!", data: message }, { status: 201 });
  } catch (error) {
    console.error("MESSAGE SEND ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}