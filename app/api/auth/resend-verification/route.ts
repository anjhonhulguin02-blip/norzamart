import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";
import { sendVerificationEmail } from "@/lib/sendVerificationEmail";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { allowed, retryAfterMs } = await checkRateLimit(`resend-verify:${userId}`, 3, 15 * 60 * 1000);
    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60000);
      return NextResponse.json({ message: `Please wait ${minutes} minute${minutes === 1 ? "" : "s"} before requesting another email.` }, { status: 429 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ message: "Your email is already verified." });
    }

    await sendVerificationEmail(user);
    return NextResponse.json({ message: "Verification email sent! Check your inbox." });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
