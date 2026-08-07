import Order from "@/lib/models/order";
import Payout from "@/lib/models/payout";

export async function getSellerBalance(sellerId: string) {
  const deliveredOrders = await Order.find({ seller: sellerId, status: "delivered" }).lean();
  const totalRevenue = deliveredOrders.reduce((sum, o: any) => sum + o.total, 0);

  // Pending requests reserve funds too, so a seller can't request more than they've actually earned.
  const reservedPayouts = await Payout.find({ seller: sellerId, status: { $in: ["pending", "approved"] } }).lean();
  const totalReserved = reservedPayouts.reduce((sum, p: any) => sum + p.amount, 0);

  return {
    totalRevenue,
    totalReserved,
    available: Math.max(totalRevenue - totalReserved, 0),
  };
}
