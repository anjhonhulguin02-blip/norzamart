import Coupon from "@/lib/models/coupon";

export async function validateCoupon(code: string, subtotal: number) {
  if (!code?.trim()) {
    return { error: "Please enter a coupon code." };
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon || !coupon.active) {
    return { error: "Invalid or inactive coupon code." };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    return { error: "This coupon has expired." };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { error: "This coupon has reached its usage limit." };
  }
  if (subtotal < (coupon.minSpend || 0)) {
    return { error: `Minimum spend of ₱${coupon.minSpend.toFixed(2)} required for this coupon.` };
  }

  let discount = coupon.type === "percent" ? (subtotal * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
  if (discount > subtotal) discount = subtotal;
  discount = Math.round(discount * 100) / 100;

  return { coupon, discount };
}
