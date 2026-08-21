import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSessionMock = vi.fn();
const findByIdMock = vi.fn();

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
  default: { findById: (...args: unknown[]) => findByIdMock(...args) },
}));

function selectLean(result: unknown) {
  return { select: () => ({ lean: () => Promise.resolve(result) }) };
}

describe("requireAdmin", () => {
  beforeEach(() => {
    getServerSessionMock.mockReset();
    findByIdMock.mockReset();
  });

  it("returns null when there is no session", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    getServerSessionMock.mockResolvedValue(null);

    expect(await requireAdmin()).toBeNull();
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it("rejects a forged session that merely claims role: 'admin' — it re-checks the database rather than trusting the session", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    // A tampered/forged JWT could still claim role: "admin" in the session
    // object handed to requireAdmin, but the current database record says
    // this user is actually a buyer.
    getServerSessionMock.mockResolvedValue({ user: { id: "attacker-1", role: "admin" } });
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "active" }));

    expect(await requireAdmin()).toBeNull();
    expect(findByIdMock).toHaveBeenCalledWith("attacker-1");
  });

  it("grants access to a real, active admin verified against the database", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    getServerSessionMock.mockResolvedValue({ user: { id: "admin-1", role: "admin" } });
    findByIdMock.mockReturnValue(selectLean({ role: "admin", status: "active" }));

    const result = await requireAdmin();
    expect(result).not.toBeNull();
  });

  it("rejects a demoted admin even though their session still says role: 'admin'", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    getServerSessionMock.mockResolvedValue({ user: { id: "demoted-1", role: "admin" } });
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "active" }));

    expect(await requireAdmin()).toBeNull();
  });

  it("rejects a banned admin", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    getServerSessionMock.mockResolvedValue({ user: { id: "banned-admin", role: "admin" } });
    findByIdMock.mockReturnValue(selectLean({ role: "admin", status: "banned" }));

    expect(await requireAdmin()).toBeNull();
  });

  it("rejects when the user record no longer exists", async () => {
    const { requireAdmin } = await import("@/lib/requireAdmin");
    getServerSessionMock.mockResolvedValue({ user: { id: "gone", role: "admin" } });
    findByIdMock.mockReturnValue(selectLean(null));

    expect(await requireAdmin()).toBeNull();
  });
});
