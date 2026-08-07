import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Notification from "@/lib/models/notification";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { notificationId } = await req.json().catch(() => ({}));
  await connectToDatabase();
  const userId = (session.user as any).id;

  if (notificationId) {
    await Notification.updateOne({ _id: notificationId, user: userId }, { read: true });
  } else {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
  }

  return NextResponse.json({ message: "Marked as read." });
}