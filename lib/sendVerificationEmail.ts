import crypto from "crypto";
import { sendMail } from "@/lib/mailer";
import User from "@/lib/models/user";

export async function sendVerificationEmail(user: { _id: any; name: string; email: string }) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await User.findByIdAndUpdate(user._id, {
    verificationToken: hashedToken,
    verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${rawToken}`;
  await sendMail({
    to: user.email,
    subject: "Verify your NorzaMart email",
    html: `
      <p>Hi ${user.name},</p>
      <p>Thanks for joining NorzaMart! Please verify your email address by clicking the link below. This link expires in 24 hours.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>You can browse and use your account before verifying, but you'll need to verify your email before placing an order.</p>
    `,
  });
}
