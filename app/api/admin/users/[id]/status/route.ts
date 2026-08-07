import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  const { status } = await req.json();
  if (!["active", "banned"].includes(status)) {
    return NextResponse.json({ message: "Invalid status." }, { status: 400 });
  }

  if (id === (session.user as any).id) {
    return NextResponse.json({ message: "You can't ban your own account." }, { status: 400 });
  }

  await connectToDatabase();
  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select("-password");
  if (!user) return NextResponse.json({ message: "User not found." }, { status: 404 });

  return NextResponse.json({ message: "Updated!", user });
}
