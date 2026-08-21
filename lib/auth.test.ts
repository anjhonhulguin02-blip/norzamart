import { describe, it, expect, vi, beforeEach } from "vitest";

const findByIdMock = vi.fn();

vi.mock("@/lib/mongodb", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/models/user", () => ({
  default: { findById: (...args: unknown[]) => findByIdMock(...args) },
}));

vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterMs: 0 }),
}));

function selectLean(result: unknown) {
  return { select: () => ({ lean: () => Promise.resolve(result) }) };
}

describe("authOptions.callbacks.jwt", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
  });

  it("never trusts a role supplied via useSession().update() — a buyer cannot self-promote to admin", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "active" }));

    // Simulates the exact forged payload a signed-in buyer could send from
    // the browser console: useSession().update({ role: "admin" }).
    const token = await authOptions.callbacks!.jwt!({
      token: { id: "buyer-1" },
      trigger: "update",
      session: { role: "admin" },
    } as any);

    expect(token.role).toBe("buyer");
    expect(findByIdMock).toHaveBeenCalledWith("buyer-1");
  });

  it("refreshes role/status from the database on every call, not just explicit update triggers", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean({ role: "seller", status: "active" }));

    const token = await authOptions.callbacks!.jwt!({
      token: { id: "user-2", role: "buyer" },
    } as any);

    expect(token.role).toBe("seller");
  });

  it("reflects a demotion immediately — an admin whose role changed in the database loses admin on the next refresh", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "active" }));

    const token = await authOptions.callbacks!.jwt!({
      token: { id: "was-admin", role: "admin" },
    } as any);

    expect(token.role).toBe("buyer");
  });

  it("marks a banned user's token status as banned on the next refresh", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "banned" }));

    const token = await authOptions.callbacks!.jwt!({
      token: { id: "banned-user", status: "active" },
    } as any);

    expect(token.status).toBe("banned");
  });

  it("treats a deleted user's token as banned rather than leaving stale role data", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean(null));

    const token = await authOptions.callbacks!.jwt!({
      token: { id: "deleted-user", role: "admin", status: "active" },
    } as any);

    expect(token.status).toBe("banned");
  });

  it("sets id and defers role/status to the database lookup on initial sign-in", async () => {
    const { authOptions } = await import("@/lib/auth");
    findByIdMock.mockReturnValue(selectLean({ role: "buyer", status: "active" }));

    const token = await authOptions.callbacks!.jwt!({
      token: {},
      user: { id: "new-user", role: "buyer" },
    } as any);

    expect(token.id).toBe("new-user");
    expect(token.role).toBe("buyer");
  });
});

describe("authOptions.callbacks.session", () => {
  it("exposes id, role, and status from the token onto session.user", async () => {
    const { authOptions } = await import("@/lib/auth");

    const session = await authOptions.callbacks!.session!({
      session: { user: {} },
      token: { id: "u1", role: "seller", status: "active" },
    } as any);

    expect((session.user as any).id).toBe("u1");
    expect((session.user as any).role).toBe("seller");
    expect((session.user as any).status).toBe("active");
  });
});
