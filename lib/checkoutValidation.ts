/**
 * Server-side re-validation of every cart item at checkout time. The
 * client's cart can go stale between "add to cart" and "place order" —
 * a product might get deactivated, rejected, or its seller banned, or
 * bad data could reach the cart some other way — so nothing here can be
 * trusted from what the client last saw; everything is re-checked
 * against the product/seller documents fetched fresh at checkout.
 */

export interface CheckoutProduct {
  _id: { toString(): string };
  name: string;
  price: number;
  unit?: string;
  image?: string;
  deliveryFee?: number;
  status: string;
  approvalStatus: string;
  seller: { _id: { toString(): string }; status?: string } | null;
}

export interface CheckoutCartItem {
  product: CheckoutProduct | null;
  quantity: number;
}

export function validateCheckoutItem(product: CheckoutProduct | null, quantity: number): string | null {
  if (!product) {
    return "A product in your basket is no longer available.";
  }
  if (product.status !== "active" || product.approvalStatus !== "approved") {
    return `"${product.name}" is no longer available.`;
  }
  if (!product.seller || product.seller.status !== "approved") {
    return `"${product.name}" is no longer available from this seller.`;
  }
  if (!Number.isFinite(product.price) || product.price <= 0) {
    return `"${product.name}" has an invalid price.`;
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return `Invalid quantity for "${product.name}".`;
  }
  return null;
}
