import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import { invalidImageMessage } from "@/lib/validateImageUrl";
import { requireApprovedSeller } from "@/lib/getSellerFromSession";

export async function PUT(req: Request) {
  try {
    // Approved-only: this route includes payout fields (gcash/bank details),
    // which a pending or rejected seller must not be able to change.
    const existingSeller = await requireApprovedSeller();
    if (!existingSeller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 401 });
    }

    const body = await req.json();
    const {
      storeName, storeLogo, storeBanner, ownerName, contactNumber, email, address, barangay,
      storeDescription, deliveryBarangays, businessHours, facebook, instagram, website, estimatedDeliveryTime,
      gcashNumber, gcashName, bankName, bankAccountNumber, bankAccountName,
    } = body;

    const imageError = invalidImageMessage(storeLogo, "Store logo") || invalidImageMessage(storeBanner, "Store banner");
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectToDatabase();
    const seller = await Seller.findOneAndUpdate(
      { _id: existingSeller._id },
      {
        storeName, storeLogo, storeBanner, ownerName, contactNumber, email, address, barangay,
        storeDescription, deliveryBarangays, businessHours, facebook, instagram, website, estimatedDeliveryTime,
        gcashNumber, gcashName, bankName, bankAccountNumber, bankAccountName,
      },
      { new: true, select: "-governmentId" }
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