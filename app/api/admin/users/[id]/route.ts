import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { name, email, role } = await req.json();
  if (!name || !email || !["buyer", "seller", "admin"].includes(role)) {
    return NextResponse.json({ message: "Please provide a valid name, email, and role." }, { status: 400 });
  }

  if (id === (session.user as any).id && role !== "admin") {
    return NextResponse.json({ message: "You can't change your own role." }, { status: 400 });
  }

  await connectToDatabase();

  const emailTaken = await User.findOne({ email, _id: { $ne: id } });
  if (emailTaken) {
    return NextResponse.json({ message: "That email is already in use by another account." }, { status: 400 });
  }

  const user = await User.findByIdAndUpdate(id, { name, email, role }, { new: true }).select("-password");
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

  return NextResponse.json({ message: "User updated!", user });
}
