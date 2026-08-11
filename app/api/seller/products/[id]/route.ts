import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { getSellerFromSession } from "@/lib/getSellerFromSession";
import { invalidImageMessage, invalidImageArrayMessage } from "@/lib/validateImageUrl";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await getSellerFromSession();
  if (!seller) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();
  const product = await Product.findOne({ _id: id, seller: seller._id });

  if (!product) {
    return NextResponse.json({ message: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await getSellerFromSession();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, category, price, originalPrice, unit, image, images, stock, tag, status,
      weight, origin, freshUntil, availableBarangays, deliveryFee, promotionEndsAt,
    } = body;

    const imageError = invalidImageMessage(image, "Product image") || invalidImageArrayMessage(images, "Product images");
    if (imageError) {
      return NextResponse.json({ message: imageError }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findOneAndUpdate(
      { _id: id, seller: seller._id },
      {
        name, description, category, price, originalPrice, unit, image, images, stock, tag, status,
        weight, origin, freshUntil: freshUntil || undefined, availableBarangays, deliveryFee,
        promotionEndsAt: promotionEndsAt || undefined,
      },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product updated!", product });
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong while updating the product." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await getSellerFromSession();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 401 });
    }

    await connectToDatabase();
    const product = await Product.findOneAndDelete({ _id: id, seller: seller._id });

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted." });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong while deleting the product." }, { status: 500 });
  }
}