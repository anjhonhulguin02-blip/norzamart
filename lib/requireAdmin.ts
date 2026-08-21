import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";

// SECURITY: the session's role already gets refreshed from the database on
// every JWT callback (see lib/auth.ts), but admin authorization re-checks
// the database directly here too rather than trusting the session alone —
// this is the actual authorization boundary for every admin-only route, so
// it must hold even if a session ever carries a stale or tampered role.
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  await connectToDatabase();
  const dbUser = await User.findById(userId).select("role status").lean<{ role?: string; status?: string } | null>();
  if (!dbUser || dbUser.role !== "admin" || dbUser.status !== "active") {
    return null;
  }
  return session;
}