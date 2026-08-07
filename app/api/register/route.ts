import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/lib/models/user';

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();
    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: 'This email is already registered.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'buyer'
    });

    return NextResponse.json({ message: 'User successfully created!' }, { status: 201 });
  } catch (error) {
    console.error('REGISTER ERROR:', error); // makikita mo na ngayon yung totoong error sa terminal
    return NextResponse.json({ message: 'Something went wrong during registration.' }, { status: 500 });
  }
}