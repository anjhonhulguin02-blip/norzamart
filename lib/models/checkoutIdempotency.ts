import { Schema, models, model } from "mongoose";

/**
 * One record per checkout attempt, keyed by a client-generated idempotency
 * key. A unique index on (buyer, key) is the actual guard against
 * duplicate orders: two requests racing to insert the same key can only
 * ever have one insert succeed, so a network retry (or a double
 * submission) of the exact same checkout attempt is detected and
 * short-circuited instead of placing a second order. See
 * app/api/orders/checkout/route.ts.
 */
const CheckoutIdempotencySchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    key: { type: String, required: true },
    status: { type: String, enum: ["processing", "completed"], default: "processing" },
    orderIds: { type: [Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

CheckoutIdempotencySchema.index({ buyer: 1, key: 1 }, { unique: true });

export default models.CheckoutIdempotency || model("CheckoutIdempotency", CheckoutIdempotencySchema);
