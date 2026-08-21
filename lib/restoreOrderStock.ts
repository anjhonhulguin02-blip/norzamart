import type { ClientSession } from "mongoose";
import Order from "@/lib/models/order";
import Product from "@/lib/models/product";

interface RestorableItem {
  product: unknown;
  quantity: number;
}

/**
 * Restores stock for every item in an order — exactly once, ever, no
 * matter how many times or how concurrently this is called for the same
 * order. The `stockRestored` flag is flipped with an atomic
 * compare-and-swap ($ne: true) inside the caller's transaction, so a
 * second concurrent call (or a retried request) for the same order sees
 * the flag already set and does nothing.
 *
 * Must be called after the order's status has already been atomically
 * transitioned (via a current-status-conditioned findOneAndUpdate) in the
 * same transaction, so this never runs against an order whose transition
 * lost a race.
 */
export async function restoreOrderStockOnce(
  orderId: unknown,
  items: RestorableItem[],
  session: ClientSession
): Promise<void> {
  const flagged = await Order.findOneAndUpdate(
    { _id: orderId, stockRestored: { $ne: true } },
    { $set: { stockRestored: true } },
    { session }
  );
  if (!flagged) return;

  for (const item of items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session }
    );
  }
}
