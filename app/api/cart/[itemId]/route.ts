import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CartItem from "@/lib/models/cart";

export async function PUT(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    const { quantity } = await req.json();
    await connectToDatabase();

    if (quantity <= 0) {
      await CartItem.findOneAndDelete({ _id: itemId, user: (session.user as any).id });
      return NextResponse.json({ message: "Item removed." });
    }

    const item = await CartItem.findOneAndUpdate(
      { _id: itemId, user: (session.user as any).id },
      { quantity },
      { new: true }
    );

    if (!item) {
      return NextResponse.json({ message: "Item not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Updated!", item });
  } catch (error) {
    console.error("CART UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const { itemId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Please log in first." }, { status: 401 });
    }

    await connectToDatabase();
    await CartItem.findOneAndDelete({ _id: itemId, user: (session.user as any).id });

    return NextResponse.json({ message: "Item removed." });
  } catch (error) {
    console.error("CART DELETE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}