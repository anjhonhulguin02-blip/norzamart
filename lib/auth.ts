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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      // Para ma-refresh yung role sa token pagkatapos maging seller, kahit walang re-login
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};