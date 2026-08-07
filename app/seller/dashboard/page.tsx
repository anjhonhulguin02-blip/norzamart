import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import Product from "@/lib/models/product";
import Order from "@/lib/models/order";
import Review from "@/lib/models/review";
import Follow from "@/lib/models/follow";
import Link from "next/link";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import MiniBarChart from "@/components/seller/MiniBarChart";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  approved: { label: "✔ Verified Store", className: "bg-basil/15 text-basil" },
  pending: { label: "⏳ Pending Approval", className: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "✕ Application Rejected", className: "bg-tomato/15 text-tomato" },
};

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();
  const seller = await Seller.findOne({ user: (session?.user as any).id });

  if (!seller) {
    return <p className="text-ink/50 text-sm font-body">Loading store…</p>;
  }

  const productCount = await Product.countDocuments({ seller: seller._id });
  const followerCount = await Follow.countDocuments({ seller: seller._id });

  const pendingCount = await Order.countDocuments({
    seller: seller._id,
    status: { $in: ["pending", "accepted", "preparing", "packed", "out_for_delivery"] },
  });

  const allOrders = await Order.find({ seller: seller._id }).populate("buyer", "name").sort({ createdAt: -1 }).lean() as any[];
  const deliveredOrders = allOrders.filter((o: any) => o.status === "delivered");
  const totalSales = deliveredOrders.reduce((sum, o: any) => sum + o.total, 0);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const todaysRevenue = deliveredOrders
    .filter((o: any) => new Date(o.createdAt) >= startOfToday)
    .reduce((sum, o: any) => sum + o.total, 0);
  const monthlyRevenue = deliveredOrders
    .filter((o: any) => new Date(o.createdAt) >= startOfMonth)
    .reduce((sum, o: any) => sum + o.total, 0);

  const lowStockProducts = await Product.find({ seller: seller._id, status: "active", stock: { $lte: 5 } })
    .select("name stock image")
    .sort({ stock: 1 })
    .limit(5)
    .lean() as any[];

  const topProducts = await Product.find({ seller: seller._id })
    .select("name image soldCount price")
    .sort({ soldCount: -1 })
    .limit(5)
    .lean() as any[];

  const productIds = (await Product.find({ seller: seller._id }).select("_id").lean() as any[]).map((p) => p._id);
  const recentReviews = await Review.find({ product: { $in: productIds } })
    .populate("product", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  const localDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const revenueByDay: { label: string; date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revenueByDay.push({ label: d.toLocaleDateString(undefined, { weekday: "short" }), date: localDateKey(d), revenue: 0 });
  }
  deliveredOrders.forEach((o: any) => {
    const dateKey = localDateKey(new Date(o.createdAt));
    const day = revenueByDay.find((d) => d.date === dateKey);
    if (day) day.revenue += o.total;
  });

  const recentOrders = allOrders.slice(0, 5);
  const statusBadge = STATUS_BADGE[seller.status] || STATUS_BADGE.pending;

  const statCards = [
    ["Today's Revenue", `₱${todaysRevenue.toFixed(2)}`],
    ["Monthly Revenue", `₱${monthlyRevenue.toFixed(2)}`],
    ["Pending Orders", String(pendingCount)],
    ["Products", String(productCount)],
    ["Total Sales", `₱${totalSales.toFixed(2)}`],
    ["Followers", String(followerCount)],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-semibold text-basil">
          Welcome, {seller.storeName}! 👋
        </h1>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>
      <p className="text-ink/60 text-sm font-body mt-1">
        Here's an overview of your store.
      </p>

      {seller.status === "pending" && (
        <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-yellow-700 text-sm font-bold">
            ⏳ Your store is awaiting admin approval. You can still add products, but your store won't be publicly visible until it's verified.
          </p>
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <Link
          href="/seller/dashboard/inventory"
          className="block mt-5 bg-tomato/10 border border-tomato/20 rounded-2xl p-4 hover:bg-tomato/15 transition-all"
        >
          <p className="text-tomato text-sm font-bold">
            ⚠️ {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's are' : ' is'} running low on stock →
          </p>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mt-6">
        {statCards.map(([label, value]) => (
          <div key={label} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <div className="font-mono text-2xl font-bold text-ink">{value}</div>
            <div className="text-ink/50 text-xs font-body mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-basil">Recent Orders</h2>
            <Link href="/seller/dashboard/orders" className="text-xs font-bold text-basil hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((o: any) => (
                <Link
                  key={o._id}
                  href={`/seller/dashboard/orders/${o._id}`}
                  className="flex items-center justify-between gap-3 hover:bg-basil/5 rounded-xl p-2 -m-2 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">#{o._id.toString().slice(-6).toUpperCase()} · {o.buyer?.name || 'Buyer'}</p>
                    <p className="text-ink/40 text-xs mt-0.5">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-bold text-ink">₱{o.total.toFixed(2)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">Revenue — Last 7 Days</h2>
          <MiniBarChart data={revenueByDay} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">🏆 Top Products</h2>
          {topProducts.filter((p) => p.soldCount > 0).length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topProducts.filter((p) => p.soldCount > 0).map((p) => (
                <div key={p._id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-white rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-ink/10">
                    {p.image ? <img src={p.image} alt={p.name} className="max-w-full max-h-full object-contain" /> : <span className="text-sm">🛒</span>}
                  </div>
                  <p className="text-sm font-semibold text-ink flex-1 truncate">{p.name}</p>
                  <span className="text-ink/40 text-xs shrink-0">{p.soldCount} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-basil mb-4">💬 Recent Reviews</h2>
          {recentReviews.length === 0 ? (
            <p className="text-ink/50 text-sm font-body">No reviews yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentReviews.map((r: any) => (
                <div key={r._id}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{r.userName}</p>
                    <span className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="text-ink/40 text-xs mt-0.5">on {r.product?.name || 'a product'}</p>
                  {r.comment && <p className="text-ink/70 text-xs font-body mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
