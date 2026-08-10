import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CartItem from "@/lib/models/cart";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";

void Seller; // para sa populate() sa ibaba

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ items: [] });
  }

  await connectToDatabase();
  const items = await CartItem.find({ user: (session.user as any).id })
    .populate({ path: "product", populate: { path: "seller", select: "storeName barangay estimatedDeliveryTime gcashNumber gcashName bankName bankAccountNumber bankAccountName" } })
    .sort({ createdAt: -1 });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { productId, quantity } = await req.json();
    if (!productId) {
      return NextResponse.json({ message: "Missing product." }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    const existing = await CartItem.findOne({ user: (session.user as any).id, product: productId });
    const addQty = quantity || 1;

    if (existing) {
      existing.quantity = Math.min(existing.quantity + addQty, product.stock || 999);
      await existing.save();
      return NextResponse.json({ message: "Cart updated!", item: existing });
    }

    const item = await CartItem.create({
      user: (session.user as any).id,
      product: productId,
      quantity: Math.min(addQty, product.stock || 999),
    });

    return NextResponse.json({ message: "Added to cart!", item }, { status: 201 });
  } catch (error) {
    console.error("CART ADD ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}