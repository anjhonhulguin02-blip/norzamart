import { Schema, models, model } from "mongoose";

const RateLimitSchema = new Schema({
  key: { type: String, required: true, unique: true },
  count: { type: Number, default: 1 },
  windowStart: { type: Date, default: Date.now },
});

// Entries are only ever read within their own window (a few minutes at most),
// so an hour of retention is generous headroom before Mongo reaps them.
RateLimitSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });

export default models.RateLimit || model("RateLimit", RateLimitSchema);
