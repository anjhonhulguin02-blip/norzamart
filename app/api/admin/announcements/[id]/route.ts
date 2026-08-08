import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Announcement from "@/lib/models/announcement";
import { requireAdmin } from "@/lib/requireAdmin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { active } = await req.json();

  await connectToDatabase();
  const announcement = await Announcement.findByIdAndUpdate(id, { active }, { new: true });
  if (!announcement) return NextResponse.json({ message: "Announcement not found." }, { status: 404 });

  return NextResponse.json({ message: "Updated!", announcement });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted." });
}
