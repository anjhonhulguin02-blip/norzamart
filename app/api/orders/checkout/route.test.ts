import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createFakeCollection,
  createFakeSession,
  type FakeFilter,
  type FakeUpdate,
} from "@/lib/testUtils/fakeCollection";

interface FakeUser {
  _id: string;
  emailVerified: boolean;
}
interface FakeSeller {
  _id: string;
  status: string;
  user: string;
}
interface FakeProduct {
  _id: string;
  name: string;
  price: number;
  stock: number;
  soldCount: number;
  status: string;
  approvalStatus: string;
  seller: FakeSeller;
  unit?: string;
  deliveryFee?: number;
}
interface FakeCartItem {
  _id: string;
  user: string;
  product: FakeProduct;
  quantity: number;
}
interface FakeOrder {
  _id: string;
  buyer: string;
  seller: string;
  items: unknown[];
  total: number;
  status: string;
}
interface FakeCoupon {
  _id: string;
  code: string;
  active: boolean;
  type: string;
  value: number;
  usageLimit?: number;
  usedCount: number;
  minSpend?: number;
}
interface FakeIdempotency {
  _id: string;
  buyer: string;
  key: string;
  status: string;
  orderIds: string[];
  createdAt: Date;
}

const BUYER_ID = "buyer-1";

let users: ReturnType<typeof createFakeCollection<FakeUser>>;
let sellers: ReturnType<typeof createFakeCollection<FakeSeller>>;
let products: ReturnType<typeof createFakeCollection<FakeProduct>>;
let cartItems: ReturnType<typeof createFakeCollection<FakeCartItem>>;
let orders: ReturnType<typeof createFakeCollection<FakeOrder>>;
let coupons: ReturnType<typeof createFakeCollection<FakeCoupon>>;
let idempotency: ReturnType<typeof createFakeCollection<FakeIdempotency>>;
let nextOrderId = 1;
const notifyMock = vi.fn();

function seedProduct(overrides: Partial<FakeProduct> = {}): FakeProduct {
  return {
    _id: "product-1",
    name: "Fresh Tomatoes",
    price: 60,
    stock: 10,
    soldCount: 0,
    status: "active",
    approvalStatus: "approved",
    seller: { _id: "seller-1", status: "approved", user: "seller-user-1" },
    ...overrides,
  };
}

function seedCartItem(overrides: Partial<FakeCartItem> = {}): FakeCartItem {
  return {
    _id: "cart-item-1",
    user: BUYER_ID,
    product: seedProduct(),
    quantity: 2,
    ...overrides,
  };
}

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

vi.mock("mongoose", () => ({
  default: { startSession: () => Promise.resolve(createFakeSession()) },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({ user: { id: BUYER_ID } })),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/models/user", () => ({
  default: { findById: (id: string) => users.findById(id) },
}));

vi.mock("@/lib/models/seller", () => ({
  default: { findById: (id: string) => sellers.findById(id) },
}));

vi.mock("@/lib/models/product", () => ({
  default: {
    findById: (id: string) => products.findById(id),
    findOneAndUpdate: (filter: FakeFilter, update: FakeUpdate, options?: unknown) =>
      products.findOneAndUpdate(filter, update, options),
  },
}));

vi.mock("@/lib/models/cart", () => ({
  default: {
    find: (filter: FakeFilter) => cartItems.find(filter),
    deleteMany: (filter: FakeFilter, options?: unknown) => cartItems.deleteMany(filter, options),
  },
}));

vi.mock("@/lib/models/order", () => ({
  default: {
    create: async (
      data:
        | (Omit<FakeOrder, "_id" | "status"> & { status?: string })
        | (Omit<FakeOrder, "_id" | "status"> & { status?: string })[],
      options?: unknown
    ) => {
      const withIds = (Array.isArray(data) ? data : [data]).map((d) => ({
        _id: `order-${nextOrderId++}`,
        status: "pending",
        ...d,
      }));
      return orders.create(withIds, options);
    },
  },
}));

vi.mock("@/lib/models/coupon", () => ({
  default: {
    findOne: (filter: FakeFilter) => coupons.findOne(filter),
    findOneAndUpdate: (filter: FakeFilter, update: FakeUpdate, options?: unknown) =>
      coupons.findOneAndUpdate(filter, update, options),
  },
}));

vi.mock("@/lib/models/checkoutIdempotency", () => ({
  default: {
    create: async (data: Omit<FakeIdempotency, "_id" | "createdAt">) => {
      // Real unique-index behavior: reject if (buyer, key) already exists.
      const dup = idempotency.docs.find((d) => d.buyer === data.buyer && d.key === data.key);
      if (dup) {
        const err = new Error("duplicate key") as Error & { code: number };
        err.code = 11000;
        throw err;
      }
      return idempotency.create({ _id: `idem-${idempotency.docs.length + 1}`, createdAt: new Date(), ...data });
    },
    findOne: (filter: FakeFilter) => idempotency.findOne(filter),
    findByIdAndUpdate: (id: string, update: FakeUpdate, options?: unknown) =>
      idempotency.findByIdAndUpdate(id, update, options),
    deleteOne: (filter: FakeFilter) => idempotency.deleteOne(filter),
  },
}));

vi.mock("@/lib/createNotification", () => ({
  createNotification: (...args: unknown[]) => notifyMock(...args),
}));

function checkoutRequest(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/orders/checkout", {
    method: "POST",
    body: JSON.stringify({
      paymentMethod: "cod",
      deliveryAddress: "123 Main St",
      deliveryBarangay: "Poblacion",
      idempotencyKey: "key-" + Math.random().toString(36).slice(2),
      ...body,
    }),
  });
}

describe("POST /api/orders/checkout", () => {
  beforeEach(() => {
    nextOrderId = 1;
    notifyMock.mockReset();
    users = createFakeCollection([{ _id: BUYER_ID, emailVerified: true }]);
    sellers = createFakeCollection([{ _id: "seller-1", status: "approved", user: "seller-user-1" }]);
    products = createFakeCollection([seedProduct()]);
    cartItems = createFakeCollection([seedCartItem()]);
    orders = createFakeCollection([]);
    coupons = createFakeCollection([]);
    idempotency = createFakeCollection([]);
  });

  it("places an order, decrements stock, and clears the cart", async () => {
    const { POST } = await import("./route");
    const res = await POST(checkoutRequest());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.orderIds).toHaveLength(1);
    expect(products.docs[0].stock).toBe(8);
    expect(cartItems.docs).toHaveLength(0);
    expect(orders.docs).toHaveLength(1);
  });

  it("rejects checkout with no idempotency key", async () => {
    const { POST } = await import("./route");
    const res = await POST(checkoutRequest({ idempotencyKey: undefined }));
    expect(res.status).toBe(400);
  });

  it("requires email verification", async () => {
    users = createFakeCollection([{ _id: BUYER_ID, emailVerified: false }]);
    const { POST } = await import("./route");
    const res = await POST(checkoutRequest());
    expect(res.status).toBe(403);
  });

  it("rejects a cart containing a product from an unapproved seller, without creating an order", async () => {
    cartItems = createFakeCollection([
      seedCartItem({ product: seedProduct({ seller: { _id: "seller-1", status: "pending", user: "u1" } }) }),
    ]);
    const { POST } = await import("./route");
    const res = await POST(checkoutRequest());

    expect(res.status).toBe(400);
    expect(orders.docs).toHaveLength(0);
    expect(products.docs[0].stock).toBe(10);
  });

  it("rejects a cart containing an inactive/unapproved product", async () => {
    cartItems = createFakeCollection([seedCartItem({ product: seedProduct({ status: "inactive" }) })]);
    const { POST } = await import("./route");
    const res = await POST(checkoutRequest());

    expect(res.status).toBe(400);
    expect(orders.docs).toHaveLength(0);
  });

  it("partial multi-seller failure: one seller's item is out of stock -> the WHOLE checkout rolls back, including the other seller's already-reserved stock", async () => {
    const productA = seedProduct({ _id: "product-A", stock: 5, seller: { _id: "seller-A", status: "approved", user: "uA" } });
    const productB = seedProduct({ _id: "product-B", stock: 1, seller: { _id: "seller-B", status: "approved", user: "uB" } });
    products = createFakeCollection([productA, productB]);
    sellers = createFakeCollection([
      { _id: "seller-A", status: "approved", user: "uA" },
      { _id: "seller-B", status: "approved", user: "uB" },
    ]);
    cartItems = createFakeCollection([
      seedCartItem({ _id: "ci-A", product: productA, quantity: 2 }),
      seedCartItem({ _id: "ci-B", product: productB, quantity: 5 }), // more than the 1 in stock
    ]);

    const { POST } = await import("./route");
    const res = await POST(checkoutRequest());

    expect(res.status).toBe(400);
    expect(orders.docs).toHaveLength(0);
    // Seller A's stock must NOT have been left decremented even though its
    // reservation succeeded before seller B's failed — the whole
    // transaction rolls back together.
    expect(products.docs.find((p) => p._id === "product-A")?.stock).toBe(5);
    expect(products.docs.find((p) => p._id === "product-B")?.stock).toBe(1);
    expect(cartItems.docs).toHaveLength(2);
  });

  it("retry after success: the same idempotency key returns the original order instead of placing a second one", async () => {
    const { POST } = await import("./route");
    const key = "retry-key-1";

    const first = await POST(checkoutRequest({ idempotencyKey: key }));
    const firstBody = await first.json();
    expect(first.status).toBe(201);

    // Cart was cleared by the first successful checkout; a genuinely new
    // checkout would now fail with "basket is empty" — proving that if the
    // second call succeeds, it can only be because of the idempotency
    // short-circuit, not because it actually re-ran checkout.
    const second = await POST(checkoutRequest({ idempotencyKey: key }));
    const secondBody = await second.json();

    expect(second.status).toBe(200);
    expect(secondBody.orderIds).toEqual(firstBody.orderIds);
    expect(orders.docs).toHaveLength(1);
    expect(products.docs[0].stock).toBe(8); // not decremented twice
  });

  it("concurrent checkout for the last unit of stock: only one request succeeds", async () => {
    products = createFakeCollection([seedProduct({ stock: 1 })]);
    cartItems = createFakeCollection([seedCartItem({ quantity: 1 })]);
    const { POST } = await import("./route");

    // Two concurrent checkout attempts (e.g. a double-tap, or two tabs)
    // both reading the same not-yet-decremented cart/stock snapshot before
    // either has committed — the atomic stock CAS inside the transaction
    // is what must ensure only one of them can actually win the last unit.
    const [resA, resB] = await Promise.all([
      POST(checkoutRequest({ idempotencyKey: "key-attempt-A" })),
      POST(checkoutRequest({ idempotencyKey: "key-attempt-B" })),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 400]);
    expect(products.docs[0].stock).toBe(0);
    expect(orders.docs).toHaveLength(1);
  });

  it("concurrent checkout racing the last use of a limited coupon: only one claims it", async () => {
    coupons = createFakeCollection([
      { _id: "coupon-1", code: "LASTUSE", active: true, type: "fixed", value: 20, usageLimit: 1, usedCount: 0, minSpend: 0 },
    ]);
    products = createFakeCollection([seedProduct({ stock: 100 })]);
    cartItems = createFakeCollection([seedCartItem({ quantity: 1 })]);

    const { POST } = await import("./route");
    const [resA, resB] = await Promise.all([
      POST(checkoutRequest({ idempotencyKey: "key-attempt-A", couponCode: "LASTUSE" })),
      POST(checkoutRequest({ idempotencyKey: "key-attempt-B", couponCode: "LASTUSE" })),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([201, 400]);
    expect(coupons.docs[0].usedCount).toBe(1);
    expect(orders.docs).toHaveLength(1);
  });
});
