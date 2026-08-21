import { Schema, models, model } from "mongoose";

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true },
    image: { type: String },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, required: true, default: 0 },
    couponCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending", "accepted", "preparing", "packed", "out_for_delivery", "delivered",
        "cancelled", "cancellation_requested", "refund_requested", "refunded",
      ],
      default: "pending",
    },
    paymentMethod: { type: String, enum: ["cod", "gcash", "bank"], default: "cod" },
    deliveryAddress: { type: String, required: true },
    deliveryBarangay: { type: String, required: true },
    statusHistory: {
      type: [StatusHistorySchema],
      default: () => [{ status: "pending", at: new Date() }],
    },
    previousStatus: { type: String },
    cancelReason: { type: String, maxlength: 500 },
    refundReason: { type: String, maxlength: 500 },
    resolutionNote: { type: String, maxlength: 500 },
    paymentReference: { type: String },
    paymentProofImage: { type: String },
    paymentConfirmedAt: { type: Date },
    // Set exactly once, atomically, the first time this order's stock is
    // restored (cancellation or resolved cancellation request) — guards
    // against a concurrent or retried request restoring it a second time.
    // See lib/restoreOrderStock.ts.
    stockRestored: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Order || model("Order", OrderSchema);