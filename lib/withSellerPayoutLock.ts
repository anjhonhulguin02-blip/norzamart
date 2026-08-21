import Seller from "@/lib/models/seller";

const LOCK_TTL_MS = 30_000;

export class PayoutLockBusyError extends Error {}

/**
 * Runs `fn` while holding an exclusive, atomically-acquired lock on this
 * seller's payout balance, so two concurrent withdrawal requests can
 * never both read the same balance and both pass — the classic
 * read-then-insert double-spend. The lock is acquired with a single
 * atomic findOneAndUpdate compare-and-swap (MongoDB guarantees that two
 * concurrent callers can't both win it), held only for the duration of
 * `fn`, and always released afterward, even if `fn` throws.
 *
 * A lock older than LOCK_TTL_MS is treated as abandoned (the holder's
 * request crashed or timed out) and can be stolen, so a crash can never
 * permanently block a seller from requesting payouts.
 */
export async function withSellerPayoutLock<T>(sellerId: unknown, fn: () => Promise<T>): Promise<T> {
  const staleBefore = new Date(Date.now() - LOCK_TTL_MS);
  const acquired = await Seller.findOneAndUpdate(
    {
      _id: sellerId,
      $or: [{ payoutLockedAt: { $exists: false } }, { payoutLockedAt: { $lt: staleBefore } }],
    },
    { $set: { payoutLockedAt: new Date() } }
  );

  if (!acquired) {
    throw new PayoutLockBusyError();
  }

  try {
    return await fn();
  } finally {
    await Seller.findOneAndUpdate({ _id: sellerId }, { $unset: { payoutLockedAt: "" } });
  }
}
