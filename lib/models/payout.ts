import { Schema, models, model } from "mongoose";

const PayoutSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ["gcash", "bank"], required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export default models.Payout || model("Payout", PayoutSchema);
