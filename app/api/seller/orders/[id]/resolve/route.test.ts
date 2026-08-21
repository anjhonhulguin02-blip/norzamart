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
  resolutionNote?: string;
}

interface FakeProduct {
  _id: string;
  stock: number;
}

const SELLER_ID = "seller-1";

let orders: ReturnType<typeof createFakeCollection<FakeOrder>>;
let products: ReturnType<typeof createFakeCollection<FakeProduct>>;
const notifyMock = vi.fn();

function seedOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    _id: "order-1",
    seller: SELLER_ID,
    buyer: "buyer-1",
    status: "cancellation_requested",
    previousStatus: "accepted",
    items: [{ product: "product-1", quantity: 4 }],
    statusHistory: [{ status: "cancellation_requested", at: new Date() }],
    stockRestored: false,
    ...overrides,
  };
}

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

vi.mock("mongoose", () => ({
  default: { startSession: () => Promise.resolve(createFakeSession()) },
}));

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

vi.mock("@/lib/getSellerFromSession", () => ({
  requireApprovedSeller: vi.fn(async () => ({ _id: SELLER_ID })),
}));

vi.mock("@/lib/createNotification", () => ({
  createNotification: (...args: unknown[]) => notifyMock(...args),
}));

function putRequest(action: string, note?: string) {
  return new Request("http://localhost/api/seller/orders/order-1/resolve", {
    method: "PUT",
    body: JSON.stringify({ action, note }),
  });
}

describe("PUT /api/seller/orders/[id]/resolve", () => {
  beforeEach(() => {
    notifyMock.mockReset();
  });

  it("approving a cancellation request restores stock and finalizes as cancelled", async () => {
    orders = createFakeCollection([seedOrder({ status: "cancellation_requested" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("approve"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("cancelled");
    expect(products.docs[0].stock).toBe(5);
  });

  it("rejecting a cancellation request reverts to previousStatus without touching stock", async () => {
    orders = createFakeCollection([seedOrder({ status: "cancellation_requested", previousStatus: "packed" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("reject", "Already shipped"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("packed");
    expect(products.docs[0].stock).toBe(1);
  });

  it("approving a refund request does NOT restore stock (goods already delivered)", async () => {
    orders = createFakeCollection([
      seedOrder({ status: "refund_requested", previousStatus: "delivered" }),
    ]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("approve"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("refunded");
    expect(products.docs[0].stock).toBe(1);
  });

  it("rejects resolving an order with no pending request", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("approve"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });

  it("rejects an overlong resolution note", async () => {
    orders = createFakeCollection([seedOrder({ status: "cancellation_requested" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("reject", "x".repeat(501)), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });

  it("two simultaneous approvals of the same cancellation request restore stock exactly once", async () => {
    orders = createFakeCollection([seedOrder({ status: "cancellation_requested" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 1 }]);
    const { PUT } = await import("./route");

    const [resA, resB] = await Promise.all([
      PUT(putRequest("approve"), { params: Promise.resolve({ id: "order-1" }) }),
      PUT(putRequest("approve"), { params: Promise.resolve({ id: "order-1" }) }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 409]);
    expect(products.docs[0].stock).toBe(5);
    expect(orders.docs[0].status).toBe("cancelled");
  });
});
