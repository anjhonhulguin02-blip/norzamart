import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Announcement from "@/lib/models/announcement";

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role || "buyer";

  const audiences = role === "seller" ? ["all", "sellers"] : role === "admin" ? [] : ["all", "buyers"];
  if (audiences.length === 0) {
    return NextResponse.json({ announcements: [] });
  }

  await connectToDatabase();
  const announcements = await Announcement.find({ active: true, audience: { $in: audiences } })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ announcements });
}
