import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Address from "@/lib/models/address";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();

  await connectToDatabase();

  const existing = await Address.findOne({ _id: id, user: userId });
  if (!existing) {
    return NextResponse.json({ message: "Address not found." }, { status: 404 });
  }

  if (body.isDefault) {
    await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  }

  const { label, recipientName, phone, address, barangay, isDefault } = body;
  if (label !== undefined) existing.label = label.trim();
  if (recipientName !== undefined) existing.recipientName = recipientName.trim();
  if (phone !== undefined) existing.phone = phone.trim();
  if (address !== undefined) existing.address = address.trim();
  if (barangay !== undefined) existing.barangay = barangay;
  if (isDefault !== undefined) existing.isDefault = isDefault;
  await existing.save();

  return NextResponse.json({ message: "Address updated!", address: existing });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  const { id } = await params;
  const userId = (session.user as any).id;

  await connectToDatabase();
  const deleted = await Address.findOneAndDelete({ _id: id, user: userId });
  if (!deleted) {
    return NextResponse.json({ message: "Address not found." }, { status: 404 });
  }

  // If we deleted the default address, promote the most recently added remaining one.
  if (deleted.isDefault) {
    const next = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }

  return NextResponse.json({ message: "Address deleted." });
}
