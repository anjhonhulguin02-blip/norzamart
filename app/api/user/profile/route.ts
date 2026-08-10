import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";
import { invalidImageMessage } from "@/lib/validateImageUrl";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const user = await User.findById((session.user as any).id).select("-password");
  return NextResponse.json({ user });
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatar, email, settings } = body;

    const imageError = invalidImageMessage(avatar, "Profile photo");
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectToDatabase();

    const current = await User.findById((session.user as any).id);

    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: (session.user as any).id } });
      if (existing) {
        return NextResponse.json({ message: "This email is already in use." }, { status: 400 });
      }
    }

    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (avatar !== undefined) updatePayload.avatar = avatar;
    if (email !== undefined && email !== current?.email) {
      updatePayload.email = email;
      // A changed email hasn't been verified yet — don't carry over the old verification.
      updatePayload.emailVerified = false;
    }

    if (settings) {
      updatePayload.settings = { ...(current?.settings?.toObject?.() || current?.settings || {}), ...settings };
    }

    const user = await User.findByIdAndUpdate(
      (session.user as any).id,
      updatePayload,
      { new: true }
    ).select("-password");

    return NextResponse.json({ message: "Profile updated!", user });
  } catch (error) {
    console.error("PROFILE UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}