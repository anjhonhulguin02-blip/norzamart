import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import CartItem from "@/lib/models/cart";
import Wishlist from "@/lib/models/wishlist";
import Order from "@/lib/models/order";
import Notification from "@/lib/models/notification";
import Address from "@/lib/models/address";
import Coupon from "@/lib/models/coupon";
import Link from "next/link";
import { formatPeso, formatUnitSuffix } from "@/lib/formatProduct";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import RecentlyViewedPreview from "@/components/buyer/RecentlyViewedPreview";

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions);
  await connectToDatabase();

  const userId = (session?.user as any).id;

  const [cartCount, wishlistCount, orderCount, unreadCount] = await Promise.all([
    CartItem.countDocuments({ user: userId }),
    Wishlist.countDocuments({ user: userId }),
    Order.countDocuments({ buyer: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ]);

  const recentOrders = await Order.find({ buyer: userId })
    .populate("seller", "storeName")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean() as any[];

  const wishlistPreview = await Wishlist.find({ user: userId })
    .populate("product", "name price unit image")
    .sort({ createdAt: -1 })
    .limit(4)
    .lean() as any[];

  const defaultAddress = await Address.findOne({ user: userId, isDefault: true }).lean() as any;

  const activeCoupons = await Coupon.find({
    active: true,
    $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }],
  }).lean() as any[];
  const availableCoupons = activeCoupons.filter((c: any) => !c.usageLimit || c.usedCount < c.usageLimit).slice(0, 2);

  const statCards = [
    ["/cart", "Items in Basket", String(cartCount)],
    ["/dashboard/wishlist", "Saved to Wishlist", String(wishlistCount)],
    ["/dashboard/orders", "Total Orders", String(orderCount)],
    ["/dashboard/notifications", "Unread Notifications", String(unreadCount)],
  ] as const;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-basil">
        Welcome back, {session?.user?.name}! 👋
      </h1>
      <p className="text-ink/60 text-sm font-body mt-1">Here's what's happening with your account.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {statCards.map(([href, label, value]) => (
          <Link key={href} href={href} className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="font-mono text-2xl font-bold text-ink">{value}</div>
            <div className="text-ink/50 text-xs font-body mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-basil">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-xs font-bold text-basil hover:underline">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">🛒</span>
              <p className="text-ink/50 text-sm font-body">No orders yet. Start shopping!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((o: any) => (
                <Link
                  key={o._id}
                  href={`/dashboard/orders/${o._id}`}
                  className="flex items-center justify-between gap-3 hover:bg-basil/5 rounded-xl p-2 -m-2 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">#{o._id.toString().slice(-6).toUpperCase()} · {o.seller?.storeName || 'Seller'}</p>
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

        <div className="flex flex-col gap-5">
          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-basil">📍 Delivery Address</h2>
              <Link href="/dashboard/addresses" className="text-xs font-bold text-basil hover:underline">Manage →</Link>
            </div>
            {defaultAddress ? (
              <div>
                <p className="text-sm font-semibold text-ink">{defaultAddress.label} · {defaultAddress.recipientName}</p>
                <p className="text-ink/60 text-xs font-body mt-1">{defaultAddress.address}, {defaultAddress.barangay}</p>
              </div>
            ) : (
              <p className="text-ink/50 text-sm font-body">No saved address yet.</p>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-base font-semibold text-basil">🎟️ Your Coupons</h2>
              <Link href="/dashboard/coupons" className="text-xs font-bold text-basil hover:underline">View all →</Link>
            </div>
            {availableCoupons.length === 0 ? (
              <p className="text-ink/50 text-sm font-body">No active promo codes right now.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {availableCoupons.map((c: any) => (
                  <div key={c._id} className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-basil tracking-wide">{c.code}</span>
                    <span className="text-ink/60 text-xs font-body">
                      {c.type === 'percent' ? `${c.value}% off` : `₱${c.value.toFixed(2)} off`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border border-white/70 rounded-2xl p-6 shadow-sm mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-basil">♡ From Your Wishlist</h2>
          <Link href="/dashboard/wishlist" className="text-xs font-bold text-basil hover:underline">View all →</Link>
        </div>
        {wishlistPreview.length === 0 ? (
          <p className="text-ink/50 text-sm font-body">Products you save will show up here.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {wishlistPreview.map((w: any) => (
              <Link
                key={w._id}
                href={`/product/${w.product?._id}`}
                className="bg-white/60 border border-white/70 rounded-xl p-3 hover:shadow-md transition-all"
              >
                <div className="w-full h-24 bg-white rounded-lg flex items-center justify-center overflow-hidden mb-2">
                  {w.product?.image ? (
                    <img src={w.product.image} alt={w.product.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <span className="text-3xl">🛒</span>
                  )}
                </div>
                <p className="font-body font-bold text-xs text-ink line-clamp-1">{w.product?.name}</p>
                <p className="font-mono text-xs font-bold text-ink mt-0.5">{formatPeso(w.product?.price || 0)} <span className="text-ink/40">{formatUnitSuffix(w.product?.unit)}</span></p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <RecentlyViewedPreview />
    </div>
  );
}
