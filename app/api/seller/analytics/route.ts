import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: "Please log in first." }, { status: 401 });
  }

  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session.user as any).id });
  if (!seller) {
    return NextResponse.json({ message: "Not a seller." }, { status: 403 });
  }

  const allOrders = await Order.find({ seller: seller._id }).lean();
  const deliveredOrders = allOrders.filter((o: any) => o.status === "delivered");

  // Local (not UTC) calendar-day key, so day-bucketing lines up with the server's local timezone.
  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const days: { label: string; date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), date: localDateKey(d), revenue: 0 });
  }
  deliveredOrders.forEach((o: any) => {
    const dateKey = localDateKey(new Date(o.createdAt));
    const day = days.find((d) => d.date === dateKey);
    if (day) day.revenue += o.total;
  });

  const productRevenue: Record<string, { name: string; revenue: number; qty: number }> = {};
  deliveredOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const key = item.product.toString();
      if (!productRevenue[key]) productRevenue[key] = { name: item.name, revenue: 0, qty: 0 };
      productRevenue[key].revenue += item.price * item.quantity;
      productRevenue[key].qty += item.quantity;
    });
  });
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const statusCounts: Record<string, number> = {};
  allOrders.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const lowStockProducts = await Product.find({ seller: seller._id, status: "active", stock: { $lte: 5 } })
    .select("name stock image")
    .sort({ stock: 1 })
    .lean();

  const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  return NextResponse.json({
    revenueByDay: days,
    topProducts,
    statusCounts,
    lowStockProducts,
    totalRevenue,
    totalOrders: allOrders.length,
    deliveredCount: deliveredOrders.length,
    avgOrderValue,
  });
}