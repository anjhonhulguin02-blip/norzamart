import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Notification from "@/lib/models/notification";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }

  await connectToDatabase();
  const userId = (session.user as any).id;

  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: userId, read: false });

  return NextResponse.json({ notifications, unreadCount });
}