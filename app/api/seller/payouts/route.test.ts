import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeCollection, type FakeFilter, type FakeUpdate } from "@/lib/testUtils/fakeCollection";

interface FakeSeller {
  _id: string;
  payoutLockedAt?: Date;
}

interface FakeOrder {
  _id: string;
  seller: string;
  status: string;
  total: number;
}

interface FakePayout {
  _id: string;
  seller: string;
  amount: number;
  method: string;
  accountName: string;
  accountNumber: string;
  status: string;
}

const SELLER_ID = "seller-1";
let sellers: ReturnType<typeof createFakeCollection<FakeSeller>>;
let orders: ReturnType<typeof createFakeCollection<FakeOrder>>;
let payouts: ReturnType<typeof createFakeCollection<FakePayout>>;
let nextPayoutId = 1;

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/getSellerFromSession", () => ({
  requireApprovedSeller: vi.fn(async () => ({ _id: SELLER_ID })),
  getSellerFromSession: vi.fn(async () => ({ _id: SELLER_ID })),
}));

vi.mock("@/lib/models/seller", () => ({
  default: {
    findOneAndUpdate: (filter: FakeFilter, update: FakeUpdate, options?: unknown) =>
      sellers.findOneAndUpdate(filter, update, options),
  },
}));

vi.mock("@/lib/models/order", () => ({
  default: { find: (filter: FakeFilter) => orders.find(filter) },
}));

vi.mock("@/lib/models/payout", () => ({
  default: {
    find: (filter: FakeFilter) => payouts.find(filter),
    create: async (data: Omit<FakePayout, "_id">) => {
      const doc = { _id: `payout-${nextPayoutId++}`, ...data };
      return payouts.create(doc);
    },
  },
}));

function postRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/seller/payouts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = { amount: 500, method: "gcash", accountName: "Juan Dela Cruz", accountNumber: "09171234567" };

describe("POST /api/seller/payouts", () => {
  beforeEach(() => {
    nextPayoutId = 1;
    sellers = createFakeCollection([{ _id: SELLER_ID }]);
    orders = createFakeCollection([{ _id: "order-1", seller: SELLER_ID, status: "delivered", total: 1000 }]);
    payouts = createFakeCollection([]);
  });

  it("creates a payout within the available balance", async () => {
    const { POST } = await import("./route");
    const res = await POST(postRequest(validBody));
    expect(res.status).toBe(201);
    expect(payouts.docs).toHaveLength(1);
  });

  it("rejects a withdrawal larger than the available balance", async () => {
    const { POST } = await import("./route");
    const res = await POST(postRequest({ ...validBody, amount: 5000 }));
    expect(res.status).toBe(400);
    expect(payouts.docs).toHaveLength(0);
  });

  it.each([
    ["zero", 0],
    ["negative", -100],
    ["non-finite", Infinity],
    ["more than 2 decimals", 100.999],
  ])("rejects an invalid amount (%s)", async (_label, amount) => {
    const { POST } = await import("./route");
    const res = await POST(postRequest({ ...validBody, amount }));
    expect(res.status).toBe(400);
    expect(payouts.docs).toHaveLength(0);
  });

  it("two simultaneous requests to withdraw the full balance: only one succeeds", async () => {
    const { POST } = await import("./route");

    const [resA, resB] = await Promise.all([
      POST(postRequest({ ...validBody, amount: 1000 })),
      POST(postRequest({ ...validBody, amount: 1000 })),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // One request wins the lock and spends the whole balance; the other
    // is either told the balance is insufficient (if it acquired the
    // lock second, after the first committed) or told to retry (if it
    // couldn't acquire the lock at all) — either way, never both 201.
    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(payouts.docs).toHaveLength(1);
    expect(payouts.docs.reduce((sum, p) => sum + p.amount, 0)).toBe(1000);
  });

  it("releases the lock after a request completes, so a later request can proceed normally", async () => {
    const { POST } = await import("./route");

    const first = await POST(postRequest({ ...validBody, amount: 400 }));
    expect(first.status).toBe(201);

    const second = await POST(postRequest({ ...validBody, amount: 400 }));
    expect(second.status).toBe(201);

    expect(payouts.docs).toHaveLength(2);
  });
});
