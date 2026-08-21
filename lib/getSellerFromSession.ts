import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongodb";
import Seller from "@/lib/models/seller";
import User from "@/lib/models/user";

/** Resolves the signed-in user's own Seller record. Re-checks the User's
 * ban status directly against the database (not the session) so a user
 * banned after their session was issued loses seller access immediately —
 * matches the same defense-in-depth pattern as requireAdmin(). */
export async function getSellerFromSession() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  await connectToDatabase();
  const user = await User.findById(userId).select("status").lean<{ status?: string } | null>();
  if (!user || user.status === "banned") return null;

  const seller = await Seller.findOne({ user: userId }).select("-governmentId");
  return seller;
}

/** Same as getSellerFromSession(), but additionally requires the store
 * itself to be approved — use this for anything that mutates products,
 * orders, or payouts, where a pending/rejected seller must be blocked. */
export async function requireApprovedSeller() {
  const seller = await getSellerFromSession();
  if (!seller || seller.status !== "approved") return null;
  return seller;
}
