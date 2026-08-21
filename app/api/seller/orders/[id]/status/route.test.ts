import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeCollection, createFakeSession, type FakeFilter, type FakeUpdate } from "@/lib/testUtils/fakeCollection";

interface FakeOrder {
  _id: string;
  seller: string;
  buyer: string;
  status: string;
  paymentMethod: string;
  paymentConfirmedAt?: Date;
  items: { product: string; quantity: number }[];
  statusHistory: { status: string; at: Date }[];
  stockRestored?: boolean;
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
    status: "pending",
    paymentMethod: "cod",
    items: [{ product: "product-1", quantity: 3 }],
    statusHistory: [{ status: "pending", at: new Date() }],
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

function putRequest(status: string) {
  return new Request("http://localhost/api/seller/orders/order-1/status", {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

describe("PUT /api/seller/orders/[id]/status", () => {
  beforeEach(() => {
    notifyMock.mockReset();
  });

  it("advances pending -> accepted, the valid next step", async () => {
    orders = createFakeCollection([seedOrder({ status: "pending" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("accepted"), { params: Promise.resolve({ id: "order-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.order.status).toBe("accepted");
  });

  it("rejects skipping straight from pending to delivered", async () => {
    orders = createFakeCollection([seedOrder({ status: "pending" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("delivered"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
    expect(orders.docs[0].status).toBe("pending");
  });

  it("rejects moving a delivered (terminal) order to any other status", async () => {
    orders = createFakeCollection([seedOrder({ status: "delivered" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("cancelled"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
    expect(orders.docs[0].status).toBe("delivered");
  });

  it("rejects an invalid backward transition (packed -> accepted)", async () => {
    orders = createFakeCollection([seedOrder({ status: "packed" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("accepted"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
    expect(orders.docs[0].status).toBe("packed");
  });

  it("cancelling restores stock", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("cancelled"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(products.docs[0].stock).toBe(13);
    expect(orders.docs[0].stockRestored).toBe(true);
  });

  it("two simultaneous cancellation requests for the same order restore stock exactly once", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const [resA, resB] = await Promise.all([
      PUT(putRequest("cancelled"), { params: Promise.resolve({ id: "order-1" }) }),
      PUT(putRequest("cancelled"), { params: Promise.resolve({ id: "order-1" }) }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // One request wins the atomic transition, the other loses the race
    // and is told to refresh — neither silently double-applies.
    expect(statuses).toEqual([200, 409]);
    expect(products.docs[0].stock).toBe(13);
    expect(orders.docs[0].status).toBe("cancelled");
  });

  it("requires payment confirmation before advancing a non-COD order", async () => {
    orders = createFakeCollection([seedOrder({ status: "pending", paymentMethod: "gcash" })]);
    products = createFakeCollection([{ _id: "product-1", stock: 10 }]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("accepted"), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });
});
