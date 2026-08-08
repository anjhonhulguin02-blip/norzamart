import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";
import Seller from "@/lib/models/seller";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ message: "Not authorized." }, { status: 403 });

  await connectToDatabase();

  const [userCount, sellerCount, pendingSellerCount, productCount, pendingProductCount, orderCount, allOrders] = await Promise.all([
    User.countDocuments({}),
    Seller.countDocuments({}),
    Seller.countDocuments({ status: "pending" }),
    Product.countDocuments({}),
    Product.countDocuments({ approvalStatus: "pending" }),
    Order.countDocuments({}),
    Order.find({ status: "delivered" }).select("total"),
  ]);

  const totalRevenue = allOrders.reduce((sum, o: any) => sum + o.total, 0);

  return NextResponse.json({
    userCount, sellerCount, pendingSellerCount, productCount, pendingProductCount, orderCount, totalRevenue,
  });
}