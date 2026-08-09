import Notification from "@/lib/models/notification";
import { pusherServer } from "@/lib/pusherServer";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: "order_status" | "new_message" | "new_review" | "seller_new_order" | "payout_update" | "product_status";
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    const notification = await Notification.create({ user: userId, type, title, body, link });
    await pusherServer.trigger(`private-user-${userId}`, "notification", {
      _id: notification._id.toString(),
      type,
      title,
      body,
      link,
      read: false,
      createdAt: notification.createdAt,
    });
  } catch (error) {
    console.error("NOTIFICATION CREATE ERROR:", error);
    // Never let a notification failure break the main action
  }
}