import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Address from "@/lib/models/address";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const addresses = await Address.find({ user: (session.user as any).id }).sort({ isDefault: -1, createdAt: -1 });
  return NextResponse.json({ addresses });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { label, recipientName, phone, address, barangay, isDefault } = await req.json();
  if (!label?.trim() || !recipientName?.trim() || !phone?.trim() || !address?.trim() || !barangay?.trim()) {
    return NextResponse.json({ message: "Please fill in all fields." }, { status: 400 });
  }

  await connectToDatabase();
  const userId = (session.user as any).id;

  const existingCount = await Address.countDocuments({ user: userId });
  const shouldBeDefault = isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const newAddress = await Address.create({
    user: userId,
    label: label.trim(),
    recipientName: recipientName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    barangay,
    isDefault: shouldBeDefault,
  });

  return NextResponse.json({ message: "Address saved!", address: newAddress }, { status: 201 });
}
