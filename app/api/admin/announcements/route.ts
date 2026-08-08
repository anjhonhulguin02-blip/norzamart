import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Announcement from "@/lib/models/announcement";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  return NextResponse.json({ announcements });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { title, body, audience } = await req.json();

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ message: "Title and message are required." }, { status: 400 });
  }
  if (audience && !["all", "buyers", "sellers"].includes(audience)) {
    return NextResponse.json({ message: "Invalid audience." }, { status: 400 });
  }

  await connectToDatabase();
  const announcement = await Announcement.create({
    title: title.trim(),
    body: body.trim(),
    audience: audience || "all",
  });

  return NextResponse.json({ message: "Announcement created!", announcement }, { status: 201 });
}
