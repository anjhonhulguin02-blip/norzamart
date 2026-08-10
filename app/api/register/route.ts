import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/user';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { sendVerificationEmail } from '@/lib/sendVerificationEmail';

export async function POST(req: Request) {
  try {
    const { allowed, retryAfterMs } = await checkRateLimit(`register:${getClientIp(req)}`, 5, 60 * 60 * 1000);
    if (!allowed) {
      const minutes = Math.ceil(retryAfterMs / 60000);
      return NextResponse.json({ message: `Too many registration attempts. Please try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` }, { status: 429 });
    }

    const { name, email, password } = await req.json();
    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'This email is already registered.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // role is intentionally never taken from the request body — self-registration
    // always creates a buyer account. Sellers are promoted via /api/seller/register,
    // and admin accounts are only ever created by direct database access.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'buyer',
    });

    try {
      await sendVerificationEmail(user);
    } catch (emailError) {
      console.error('VERIFICATION EMAIL SEND ERROR:', emailError);
      // Don't fail registration over a mail hiccup — they can use "Resend" later.
    }

    return NextResponse.json({ message: 'User successfully created!' }, { status: 201 });
  } catch (error) {
    console.error('REGISTER ERROR:', error); // makikita mo na ngayon yung totoong error sa terminal
    return NextResponse.json({ message: 'Something went wrong during registration.' }, { status: 500 });
  }
}