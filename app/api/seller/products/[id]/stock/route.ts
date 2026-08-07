import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Product from "@/lib/models/product";
import { getSellerFromSession } from "@/lib/getSellerFromSession";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const seller = await getSellerFromSession();
    if (!seller) {
      return NextResponse.json({ message: "Not authorized." }, { status: 401 });
    }

    const { stock } = await req.json();
    if (stock === undefined || stock < 0) {
      return NextResponse.json({ message: "Invalid stock value." }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findOneAndUpdate(
      { _id: id, seller: seller._id },
      { stock },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ message: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Stock updated!", product });
  } catch (error) {
    console.error("STOCK UPDATE ERROR:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}