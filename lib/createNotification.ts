import Notification from "@/lib/models/notification";

export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: "order_status" | "new_message" | "new_review" | "seller_new_order" | "payout_update";
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await Notification.create({ user: userId, type, title, body, link });
  } catch (error) {
    console.error("NOTIFICATION CREATE ERROR:", error);
    // Never let a notification failure break the main action
  }
}