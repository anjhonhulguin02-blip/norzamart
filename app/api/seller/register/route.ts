import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const {
      storeName, storeLogo, storeBanner, ownerName, contactNumber,
      email, address, barangay, governmentId, storeDescription,
      businessHours, facebook, instagram, website,
    } = body;

    if (!storeName || !ownerName || !contactNumber || !email || !address || !barangay || !governmentId) {
      return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Seller.findOne({ user: (session.user as any).id });
    if (existing) {
      await User.findByIdAndUpdate((session.user as any).id, { role: "seller" });
      return NextResponse.json(
        { message: "You already have a registered store.", alreadyRegistered: true },
        { status: 400 }
      );
    }

    const seller = await Seller.create({
      user: (session.user as any).id,
      storeName, storeLogo, storeBanner, ownerName, contactNumber,
      email, address, barangay, governmentId, storeDescription,
      businessHours, facebook, instagram, website,
    });

    await User.findByIdAndUpdate((session.user as any).id, { role: "seller" });

    return NextResponse.json({ message: "Seller account created!", seller }, { status: 201 });
  } catch (error) {
    console.error("SELLER REGISTER ERROR:", error);
    return NextResponse.json({ message: "Something went wrong while registering your store." }, { status: 500 });
  }
}