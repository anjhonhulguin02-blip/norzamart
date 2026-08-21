import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSessionMock = vi.fn();
const userFindByIdMock = vi.fn();
const sellerFindOneMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => getServerSessionMock(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/models/user", () => ({
  default: { findById: (...args: unknown[]) => userFindByIdMock(...args) },
}));

vi.mock("@/lib/models/seller", () => ({
  default: { findOne: (...args: unknown[]) => sellerFindOneMock(...args) },
}));

function userLean(result: unknown) {
  return { select: () => ({ lean: () => Promise.resolve(result) }) };
}

function sellerSelect(result: unknown) {
  return { select: () => Promise.resolve(result) };
}

describe("getSellerFromSession", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    userFindByIdMock.mockReset();
    sellerFindOneMock.mockReset();
  });

  it("returns null when signed out", async () => {
    const { getSellerFromSession } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue(null);

    expect(await getSellerFromSession()).toBeNull();
  });

  it("rejects a banned user even if their seller record exists and is approved", async () => {
    const { getSellerFromSession } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue({ user: { id: "banned-seller" } });
    userFindByIdMock.mockReturnValue(userLean({ status: "banned" }));

    expect(await getSellerFromSession()).toBeNull();
    expect(sellerFindOneMock).not.toHaveBeenCalled();
  });

  it("returns the seller record for an active, non-banned user", async () => {
    const { getSellerFromSession } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue({ user: { id: "seller-1" } });
    userFindByIdMock.mockReturnValue(userLean({ status: "active" }));
    sellerFindOneMock.mockReturnValue(sellerSelect({ _id: "s1", status: "pending" }));

    const seller = await getSellerFromSession();
    expect(seller).toEqual({ _id: "s1", status: "pending" });
  });
});

describe("requireApprovedSeller", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    userFindByIdMock.mockReset();
    sellerFindOneMock.mockReset();
  });

  it("rejects a pending seller trying to mutate products/orders/payouts", async () => {
    const { requireApprovedSeller } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue({ user: { id: "pending-seller" } });
    userFindByIdMock.mockReturnValue(userLean({ status: "active" }));
    sellerFindOneMock.mockReturnValue(sellerSelect({ _id: "s1", status: "pending" }));

    expect(await requireApprovedSeller()).toBeNull();
  });

  it("rejects a rejected seller", async () => {
    const { requireApprovedSeller } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue({ user: { id: "rejected-seller" } });
    userFindByIdMock.mockReturnValue(userLean({ status: "active" }));
    sellerFindOneMock.mockReturnValue(sellerSelect({ _id: "s1", status: "rejected" }));

    expect(await requireApprovedSeller()).toBeNull();
  });

  it("allows an approved, active seller", async () => {
    const { requireApprovedSeller } = await import("@/lib/getSellerFromSession");
    getServerSessionMock.mockResolvedValue({ user: { id: "approved-seller" } });
    userFindByIdMock.mockReturnValue(userLean({ status: "active" }));
    sellerFindOneMock.mockReturnValue(sellerSelect({ _id: "s1", status: "approved" }));

    const seller = await requireApprovedSeller();
    expect(seller).not.toBeNull();
  });
});
