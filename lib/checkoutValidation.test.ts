import { describe, it, expect } from "vitest";
import { validateCheckoutItem, type CheckoutProduct } from "@/lib/checkoutValidation";

function product(overrides: Partial<CheckoutProduct> = {}): CheckoutProduct {
  return {
    _id: { toString: () => "product-1" },
    name: "Fresh Tomatoes",
    price: 60,
    status: "active",
    approvalStatus: "approved",
    seller: { _id: { toString: () => "seller-1" }, status: "approved" },
    ...overrides,
  };
}

describe("validateCheckoutItem", () => {
  it("accepts a fully valid item", () => {
    expect(validateCheckoutItem(product(), 2)).toBeNull();
  });

  it("rejects a missing product", () => {
    expect(validateCheckoutItem(null, 1)).toMatch(/no longer available/);
  });

  it("rejects an inactive product", () => {
    expect(validateCheckoutItem(product({ status: "inactive" }), 1)).toMatch(/no longer available/);
  });

  it("rejects a product pending or rejected moderation", () => {
    expect(validateCheckoutItem(product({ approvalStatus: "pending" }), 1)).toMatch(/no longer available/);
    expect(validateCheckoutItem(product({ approvalStatus: "rejected" }), 1)).toMatch(/no longer available/);
  });

  it("rejects a product whose seller is not approved", () => {
    expect(
      validateCheckoutItem(product({ seller: { _id: { toString: () => "s1" }, status: "pending" } }), 1)
    ).toMatch(/seller/);
  });

  it("rejects a product with no seller at all", () => {
    expect(validateCheckoutItem(product({ seller: null }), 1)).toMatch(/seller/);
  });

  it("rejects a non-finite or non-positive price", () => {
    expect(validateCheckoutItem(product({ price: 0 }), 1)).toMatch(/price/);
    expect(validateCheckoutItem(product({ price: -5 }), 1)).toMatch(/price/);
    expect(validateCheckoutItem(product({ price: Infinity }), 1)).toMatch(/price/);
    expect(validateCheckoutItem(product({ price: NaN }), 1)).toMatch(/price/);
  });

  it("rejects a non-integer or non-positive quantity", () => {
    expect(validateCheckoutItem(product(), 0)).toMatch(/quantity/);
    expect(validateCheckoutItem(product(), -1)).toMatch(/quantity/);
    expect(validateCheckoutItem(product(), 2.5)).toMatch(/quantity/);
  });
});
