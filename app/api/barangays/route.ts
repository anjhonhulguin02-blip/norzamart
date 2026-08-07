import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Barangay from "@/lib/models/barangay";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  await connectToDatabase();
  const barangays = await Barangay.find().sort({ name: 1 });
  return NextResponse.json({ barangays });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ message: "Barangay name is required." }, { status: 400 });
  }

  await connectToDatabase();
  try {
    const barangay = await Barangay.create({ name: name.trim() });
    return NextResponse.json({ message: "Barangay added!", barangay }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ message: "That barangay already exists." }, { status: 409 });
    }
    console.error("BARANGAY CREATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
