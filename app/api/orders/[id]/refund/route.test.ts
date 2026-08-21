import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeCollection, createFakeSession, type FakeFilter, type FakeUpdate } from "@/lib/testUtils/fakeCollection";

interface FakeOrder {
  _id: string;
  seller: string;
  buyer: string;
  status: string;
  previousStatus?: string;
  refundReason?: string;
  statusHistory: { status: string; at: Date }[];
}

const BUYER_ID = "buyer-1";

let orders: ReturnType<typeof createFakeCollection<FakeOrder>>;
const notifyMock = vi.fn();

function seedOrder(overrides: Partial<FakeOrder> = {}): FakeOrder {
  return {
    _id: "order-1",
    seller: "seller-1",
    buyer: BUYER_ID,
    status: "delivered",
    statusHistory: [{ status: "delivered", at: new Date() }],
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

vi.mock("@/lib/models/seller", () => ({
  default: { findById: vi.fn(async () => ({ user: { toString: () => "seller-user-1" } })) },
}));

vi.mock("@/lib/createNotification", () => ({
  createNotification: (...args: unknown[]) => notifyMock(...args),
}));

function putRequest(body?: Record<string, unknown>) {
  return new Request("http://localhost/api/orders/order-1/refund", {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("PUT /api/orders/[id]/refund", () => {
  beforeEach(() => {
    notifyMock.mockReset();
  });

  it("requests a refund for a delivered order with a reason", async () => {
    orders = createFakeCollection([seedOrder({ status: "delivered" })]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest({ reason: "Item was spoiled" }), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(200);
    expect(orders.docs[0].status).toBe("refund_requested");
  });

  it("rejects a refund request without a reason", async () => {
    orders = createFakeCollection([seedOrder({ status: "delivered" })]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest(), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });

  it("rejects a refund request for a non-delivered order", async () => {
    orders = createFakeCollection([seedOrder({ status: "accepted" })]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest({ reason: "Too soon" }), { params: Promise.resolve({ id: "order-1" }) });

    expect(res.status).toBe(400);
  });
});
