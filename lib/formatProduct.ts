/** Single source of truth for how prices, units, and order-line quantities are
 * displayed. Previously every surface (product card, detail page, cart,
 * checkout, order history) hand-rolled its own `₱{price}` / `/{unit}` string,
 * with inconsistent decimal formatting and inconsistent "/unit" vs "× qty
 * unit" phrasing between them.
 */

export function formatPeso(amount: number): string {
  return `₱${amount.toFixed(2)}`;
}

export function formatUnitSuffix(unit?: string): string {
  return `/${unit || "piece"}`;
}

/** "₱650.00/kilo" — price shown alongside its unit, e.g. on cards and the detail page. */
export function formatPriceWithUnit(price: number, unit?: string): string {
  return `${formatPeso(price)}${formatUnitSuffix(unit)}`;
}

/** "₱100.00 × 2 kilo" — a single order/cart line's unit price and quantity. */
export function formatOrderLineQuantity(price: number, quantity: number, unit?: string): string {
  return `${formatPeso(price)} × ${quantity} ${unit || "piece"}`;
}

/** "₱200.00" — the extended total for a line (price × quantity). */
export function formatLineTotal(price: number, quantity: number): string {
  return formatPeso(price * quantity);
}
