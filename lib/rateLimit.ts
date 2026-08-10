import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import "@/lib/models/rateLimit"; // ensures the TTL index gets created

/**
 * Fixed-window rate limiter backed by MongoDB (no separate cache/Redis needed
 * for this app's scale). Goes through the native driver collection directly
 * (rather than Mongoose's query builder) so the window-reset-vs-increment
 * decision can be a single atomic findOneAndUpdate via an aggregation
 * pipeline update — concurrent requests for the same key can't both slip
 * through as "first in a new window."
 */
export async function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  await connectToDatabase();
  const now = new Date();
  const collection = mongoose.connection.db!.collection("ratelimits");

  const result = await collection.findOneAndUpdate(
    { key },
    [
      {
        $set: {
          windowStart: {
            $cond: [
              { $gt: [now, { $add: [{ $ifNull: ["$windowStart", now] }, windowMs] }] },
              now,
              { $ifNull: ["$windowStart", now] },
            ],
          },
        },
      },
      {
        $set: {
          count: {
            $cond: [{ $eq: ["$windowStart", now] }, 1, { $add: [{ $ifNull: ["$count", 0] }, 1] }],
          },
        },
      },
    ],
    { upsert: true, returnDocument: "after" }
  );

  const doc = result as any;
  if (doc.count > maxAttempts) {
    const retryAfterMs = Math.max(windowMs - (now.getTime() - new Date(doc.windowStart).getTime()), 0);
    return { allowed: false, retryAfterMs };
  }
  return { allowed: true, retryAfterMs: 0 };
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
