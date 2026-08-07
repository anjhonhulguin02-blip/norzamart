import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import Product from "@/lib/models/product";
import User from "@/lib/models/user";
import Barangay from "@/lib/models/barangay";

export async function GET() {
  await connectToDatabase();

  const [sellerCount, productCount, buyerCount, barangayCount] = await Promise.all([
    Seller.countDocuments({}),
    Product.countDocuments({ status: "active" }),
    User.countDocuments({}),
    Barangay.countDocuments({}),
  ]);

  return NextResponse.json({
    sellers: sellerCount,
    products: productCount,
    barangays: barangayCount,
    members: buyerCount,
  });
}