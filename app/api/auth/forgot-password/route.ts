import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";
import { sendMail } from "@/lib/mailer";

const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: "Please enter your email address." }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`;
      await sendMail({
        to: user.email,
        subject: "Reset your NorzaMart password",
        html: `
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your NorzaMart password. Click the link below to choose a new one. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
