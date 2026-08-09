import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { getSellerFromSession } from "@/lib/getSellerFromSession";

export async function GET() {
  const seller = await getSellerFromSession();
  if (!seller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  const products = await Product.find({ seller: seller._id }).sort({ createdAt: -1 });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  try {
    const seller = await getSellerFromSession();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 401 });
    }
    if (seller.status !== "approved") {
      return NextResponse.json({ message: "Your store must be verified before you can list products." }, { status: 403 });
    }

    const body = await req.json();
    const {
      name, description, category, price, originalPrice, unit, image, images, stock, tag,
      weight, origin, freshUntil, availableBarangays, deliveryFee,
    } = body;

    if (!name || !category || price === undefined || stock === undefined) {
      return NextResponse.json({ message: "Please fill in all required fields." }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.create({
      seller: seller._id,
      name, description, category, price, originalPrice, unit, image, images, stock, tag,
      weight, origin, freshUntil: freshUntil || undefined, availableBarangays, deliveryFee,
    });

    return NextResponse.json({ message: "Product created!", product }, { status: 201 });
  } catch (error) {
    console.error("PRODUCT CREATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong while creating the product." }, { status: 500 });
  }
}