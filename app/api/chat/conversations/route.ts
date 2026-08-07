import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Conversation from "@/lib/models/conversation";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";
import Product from "@/lib/models/product";

void User;
void Product;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ conversations: [] });
  }

  await connectToDatabase();

  const myUserId = (session.user as any).id;
  const mySeller = await Seller.findOne({ user: myUserId });

  const orConditions: any[] = [{ buyer: myUserId }];
  if (mySeller) {
    orConditions.push({ seller: mySeller._id });
  }

  const conversations = await Conversation.find({ $or: orConditions })
    .populate("buyer", "name avatar")
    .populate({ path: "seller", select: "storeName storeLogo user", populate: { path: "user", select: "name" } })
    .populate("product", "name")
    .sort({ lastMessageAt: -1 });

  return NextResponse.json({ conversations, myUserId, mySellerId: mySeller?._id?.toString() || null });
}