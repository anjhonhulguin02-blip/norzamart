import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeCollection, type FakeFilter, type FakeUpdate } from "@/lib/testUtils/fakeCollection";

interface FakePayout {
  _id: string;
  seller: string;
  amount: number;
  status: string;
  adminNote?: string;
  processedAt?: Date;
}

let payouts: ReturnType<typeof createFakeCollection<FakePayout>>;
const notifyMock = vi.fn();

vi.mock("@/lib/mongodb", () => ({ default: vi.fn().mockResolvedValue(undefined) }));

vi.mock("@/lib/requireAdmin", () => ({
  requireAdmin: vi.fn(async () => ({ user: { id: "admin-1" } })),
}));

vi.mock("@/lib/models/payout", () => ({
  default: {
    findOneAndUpdate: (filter: FakeFilter, update: FakeUpdate, options?: unknown) =>
      payouts.findOneAndUpdate(filter, update, options),
    exists: (filter: FakeFilter) => payouts.exists(filter),
  },
}));

vi.mock("@/lib/models/seller", () => ({
  default: { findById: vi.fn(async () => ({ user: { toString: () => "seller-user-1" } })) },
}));

vi.mock("@/lib/createNotification", () => ({
  createNotification: (...args: unknown[]) => notifyMock(...args),
}));

function putRequest(status: string, adminNote?: string) {
  return new Request("http://localhost/api/admin/payouts/payout-1", {
    method: "PUT",
    body: JSON.stringify({ status, adminNote }),
  });
}

function seedPayout(overrides: Partial<FakePayout> = {}): FakePayout {
  return { _id: "payout-1", seller: "seller-1", amount: 500, status: "pending", ...overrides };
}

describe("PUT /api/admin/payouts/[id]", () => {
  beforeEach(() => {
    notifyMock.mockReset();
  });

  it("approves a pending payout", async () => {
    payouts = createFakeCollection([seedPayout()]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("approved"), { params: Promise.resolve({ id: "payout-1" }) });

    expect(res.status).toBe(200);
    expect(payouts.docs[0].status).toBe("approved");
  });

  it("rejects a payout that's already been processed", async () => {
    payouts = createFakeCollection([seedPayout({ status: "approved" })]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("rejected"), { params: Promise.resolve({ id: "payout-1" }) });

    expect(res.status).toBe(400);
    expect(payouts.docs[0].status).toBe("approved");
  });

  it("404s for a payout that doesn't exist", async () => {
    payouts = createFakeCollection([]);
    const { PUT } = await import("./route");

    const res = await PUT(putRequest("approved"), { params: Promise.resolve({ id: "missing" }) });

    expect(res.status).toBe(404);
  });

  it("two simultaneous approve requests for the same pending payout: only one succeeds", async () => {
    payouts = createFakeCollection([seedPayout()]);
    const { PUT } = await import("./route");

    const [resA, resB] = await Promise.all([
      PUT(putRequest("approved"), { params: Promise.resolve({ id: "payout-1" }) }),
      PUT(putRequest("approved"), { params: Promise.resolve({ id: "payout-1" }) }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 400]);
    expect(payouts.docs[0].status).toBe("approved");
  });

  it("one approve and one reject racing the same payout: exactly one wins, never both", async () => {
    payouts = createFakeCollection([seedPayout()]);
    const { PUT } = await import("./route");

    const [resApprove, resReject] = await Promise.all([
      PUT(putRequest("approved"), { params: Promise.resolve({ id: "payout-1" }) }),
      PUT(putRequest("rejected"), { params: Promise.resolve({ id: "payout-1" }) }),
    ]);

    const statuses = [resApprove.status, resReject.status].sort();
    expect(statuses).toEqual([200, 400]);
    expect(["approved", "rejected"]).toContain(payouts.docs[0].status);
  });
});
