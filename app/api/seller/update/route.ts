import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const body = await req.json();
    const {
      storeName, storeLogo, storeBanner, ownerName, contactNumber, email, address, barangay,
      storeDescription, deliveryBarangays, businessHours, facebook, instagram, website,
    } = body;

    await connectToDatabase();
    const seller = await Seller.findOneAndUpdate(
      { user: (session.user as any).id },
      {
        storeName, storeLogo, storeBanner, ownerName, contactNumber, email, address, barangay,
        storeDescription, deliveryBarangays, businessHours, facebook, instagram, website,
      },
      { new: true }
    );

    if (!seller) {
      return NextResponse.json({ message: "Seller not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Store updated!", seller });
  } catch (error) {
    console.error("SELLER UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}