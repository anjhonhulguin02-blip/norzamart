import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/mongodb";
import User from "@/lib/models/user";
import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { checkRateLimit } from "@/lib/rateLimit";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectToDatabase();

        const email = (credentials?.email || "").toLowerCase().trim();
        const { allowed, retryAfterMs } = await checkRateLimit(`login:${email}`, 8, 10 * 60 * 1000);
        if (!allowed) {
          const minutes = Math.ceil(retryAfterMs / 60000);
          throw new Error(`Too many login attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
        }

        const user = await User.findOne({ email: credentials?.email });
        if (!user) {
          throw new Error("No user found with this email.");
        }

        const isValidPassword = await bcrypt.compare(credentials!.password, user.password);
        if (!isValidPassword) {
          throw new Error("Incorrect password.");
        }

        if (user.status === "banned") {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || "buyer",
        };
      }
    })
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/" },
  callbacks: {
    // SECURITY: role/status must never be taken from the client. Previously
    // `trigger === "update" && session?.role` copied whatever role the
    // client passed to useSession().update({...}) straight into the token —
    // any signed-in buyer could call update({ role: "admin" }) from the
    // browser console and requireAdmin() would trust it. The database is now
    // the only source of truth: every refresh re-reads the user's current
    // role/status by their trusted token id (never from `session`), so a
    // demoted or banned user's existing JWT stops carrying elevated access
    // on the very next request instead of waiting up to 30 days to expire.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id) {
        await connectToDatabase();
        const dbUser = await User.findById(token.id).select("role status").lean<{ role?: string; status?: string } | null>();
        token.role = dbUser?.role || "buyer";
        token.status = dbUser?.status || (dbUser ? "active" : "banned");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
};