/**
 * Single source of truth for which order-status transitions are legal.
 * Every route that mutates Order.status must check against these tables
 * (via an atomic, current-status-conditioned update) instead of merely
 * checking that the target status is a member of some list — membership
 * alone allows skipping steps (pending -> delivered) or moving backward
 * (packed -> accepted), neither of which reflects a real transition.
 */

export const MAIN_FLOW = [
  "pending",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
  "delivered",
] as const;

/** Statuses that can never change again once reached. */
export const TERMINAL_STATUSES = ["delivered", "cancelled", "refunded"] as const;

/** Exact single successor per status, for the seller's step-by-step flow. */
export const SELLER_NEXT_STATUS: Record<string, string> = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

/** The seller can cancel outright (nothing was ever delivered) from any of these. */
export const SELLER_CANCELLABLE_FROM: string[] = [
  "pending",
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
];

/** Buyer cancels instantly (order never left pending) — stock restores immediately. */
export const BUYER_INSTANT_CANCEL_FROM: string[] = ["pending"];

/** Buyer must ask the seller to cancel once work may already be underway. */
export const BUYER_CANCEL_REQUEST_FROM: string[] = [
  "accepted",
  "preparing",
  "packed",
  "out_for_delivery",
];

/** Buyer can only request a refund after the order was actually delivered. */
export const BUYER_REFUND_REQUEST_FROM: string[] = ["delivered"];

/** Statuses awaiting a seller decision — only the resolve route may leave these. */
export const RESOLVABLE_STATUSES: string[] = ["cancellation_requested", "refund_requested"];

/** Max length for any buyer/seller-supplied order note (cancel/refund/resolution reason). */
export const MAX_NOTE_LENGTH = 500;

export function isTerminalStatus(status: string): boolean {
  return (TERMINAL_STATUSES as readonly string[]).includes(status);
}

export function isValidSellerAdvance(currentStatus: string, targetStatus: string): boolean {
  return SELLER_NEXT_STATUS[currentStatus] === targetStatus;
}
