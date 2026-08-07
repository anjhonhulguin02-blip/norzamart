import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ message: "Not authorized." }, { status: 401 });
  }

  await connectToDatabase();

  const allOrders = await Order.find().lean();
  const deliveredOrders = allOrders.filter((o: any) => o.status === "delivered");

  // Local (not UTC) calendar-day key, so day-bucketing lines up with the server's local timezone.
  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Revenue for the last 7 days, platform-wide
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

  // Top products platform-wide
  const productStats: Record<string, { name: string; revenue: number; qty: number }> = {};
  deliveredOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const key = item.product.toString();
      if (!productStats[key]) productStats[key] = { name: item.name, revenue: 0, qty: 0 };
      productStats[key].revenue += item.price * item.quantity;
      productStats[key].qty += item.quantity;
    });
  });
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top sellers by revenue
  const sellerStats: Record<string, { revenue: number; orders: number }> = {};
  deliveredOrders.forEach((o: any) => {
    const key = o.seller.toString();
    if (!sellerStats[key]) sellerStats[key] = { revenue: 0, orders: 0 };
    sellerStats[key].revenue += o.total;
    sellerStats[key].orders += 1;
  });
  const sellerIds = Object.keys(sellerStats);
  const sellerDocs = await Seller.find({ _id: { $in: sellerIds } }).select("storeName").lean();
  const sellerNameMap: Record<string, string> = {};
  sellerDocs.forEach((s: any) => { sellerNameMap[s._id.toString()] = s.storeName; });
  const topSellers = sellerIds
    .map((id) => ({ storeName: sellerNameMap[id] || "Unknown Store", ...sellerStats[id] }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Revenue by product category
  const allProductIds = Array.from(new Set(deliveredOrders.flatMap((o: any) => o.items.map((i: any) => i.product.toString()))));
  const productDocs = await Product.find({ _id: { $in: allProductIds } }).select("category").lean();
  const productCategoryMap: Record<string, string> = {};
  productDocs.forEach((p: any) => { productCategoryMap[p._id.toString()] = p.category; });
  const categoryRevenue: Record<string, number> = {};
  deliveredOrders.forEach((o: any) => {
    o.items.forEach((item: any) => {
      const category = productCategoryMap[item.product.toString()] || "Others";
      categoryRevenue[category] = (categoryRevenue[category] || 0) + item.price * item.quantity;
    });
  });
  const revenueByCategory = Object.entries(categoryRevenue)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Orders by barangay
  const barangayCounts: Record<string, number> = {};
  allOrders.forEach((o: any) => {
    barangayCounts[o.deliveryBarangay] = (barangayCounts[o.deliveryBarangay] || 0) + 1;
  });
  const ordersByBarangay = Object.entries(barangayCounts)
    .map(([barangay, count]) => ({ barangay, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const statusCounts: Record<string, number> = {};
  allOrders.forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const totalRevenue = deliveredOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  const avgOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

  const [totalBuyers, totalSellers] = await Promise.all([
    User.countDocuments({ role: "buyer" }),
    Seller.countDocuments({}),
  ]);

  return NextResponse.json({
    revenueByDay: days,
    topProducts,
    topSellers,
    revenueByCategory,
    ordersByBarangay,
    statusCounts,
    totalRevenue,
    totalOrders: allOrders.length,
    deliveredCount: deliveredOrders.length,
    avgOrderValue,
    totalBuyers,
    totalSellers,
  });
}
