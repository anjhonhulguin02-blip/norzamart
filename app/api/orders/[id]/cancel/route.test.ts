import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeCollection, createFakeSession, type FakeFilter, type FakeUpdate } from "@/lib/testUtils/fakeCollection";

interface FakeOrder {
  _id: string;
  seller: string;
  buyer: string;
  status: string;
  items: { product: string; quantity: number }[];
  statusHistory: { status: string; at: Date }[];
  stockRestored?: boolean;
  previousStatus?: string;
  cancelReason?: string;
}

interface FakeProduct {
  _id: string;
  stock: number;
}

const BUYER_ID = "buyer-1";

let orders: ReturnType<typeof createFakeCollection<FakeOrder>>;
let products: ReturnType<typeof createFakeCollection<FakeProduct>>;
const notifyMock = vi.fn();

function seedOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    _id: "order-1",
    seller: "seller-1",
    buyer: BUYER_ID,
    status: "pending",
    items: [{ product: "product-1", quantity: 2 }],
    statusHistory: [{ status: "pending", at: new Date() }],
    stockRestored: false,
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

vi.mock("@/lib/models/order", () => ({
  default: {
    findOne: (filter: FakeFilter) => orders.findOne(filter),
    findOneAndUpdate: (filter: FakeFilter, update: FakeUpdate, options?: unknown) =>
      orders.findOneAndUpdate(filter, update, options),
  },
}));

vi.mock("@/lib/models/product", () => ({
  default: {
    findByIdAndUpdate: (id: string, update: FakeUpdate, options?: unknown) =>
      products.findByIdAndUpdate(id, update, options),
  },
}));

vi.mock("@/lib/models/seller", () => ({
  default: { findById: vi.fn(async () => ({ user: { toString: () => "seller-user-1" } })) },
}));

vi.mock("@/lib/createNotification", () => ({
  createNotification: (...args: unknown[]) => notifyMock(...args),
}));

function putRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/orders/order-1/cancel", {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("PUT /api/orders/[id]/cancel", () => {
  beforeEach(() => {
    notifyMock.mockReset();
  });

  it("cancels a pending order instantly and restores stock, no reason required", async () => {
    orders = createFakeCollection([seedOrder({ status: "pending" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("cancelled");
    expect(products.docs[0].stock).toBe(7);
  });

  it("requires a reason once the seller may already be working on it", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
    expect(orders.docs[0].status).toBe("accepted");
  });

  it("moves an accepted order to cancellation_requested with a reason, without touching stock yet", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest({ reason: "Changed my mind" }), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("cancellation_requested");
    expect(orders.docs[0].previousStatus).toBe("accepted");
    expect(products.docs[0].stock).toBe(5);
  });

  it("rejects a request once delivered — no cancellation available", async () => {
    orders = createFakeCollection([seedOrder({ status: "delivered" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });

  it("rejects an overlong reason", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest({ reason: "x".repeat(501) }), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });

  it("two simultaneous instant-cancel requests for the same pending order restore stock exactly once", async () => {
    orders = createFakeCollection([seedOrder({ status: "pending" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 5 }]);
    const { PUT } = await import("./route");

    const [resA, resB] = await Promise.all([
      PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) }),
      PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(products.docs[0].stock).toBe(7);
    expect(orders.docs[0].status).toBe("cancelled");
  });
});
