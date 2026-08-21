import { Schema, models, model } from "mongoose";

const SellerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    storeName: { type: String, required: true },
    storeLogo: { type: String },
    storeBanner: { type: String },
    ownerName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    barangay: { type: String, required: true },
    governmentId: { type: String, required: true },
    storeDescription: { type: String },
    businessHours: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    website: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    deliveryBarangays: { type: [String], default: [] },
    estimatedDeliveryTime: { type: String, enum: ["", "Same-day", "1-2 days", "2-3 days", "3-5 days"], default: "" },
    gcashNumber: { type: String },
    gcashName: { type: String },
    bankName: { type: String },
    bankAccountNumber: { type: String },
    bankAccountName: { type: String },
    // Transient distributed lock guarding payout-balance checks — see
    // lib/withSellerPayoutLock.ts. Absent/unset means unlocked.
    payoutLockedAt: { type: Date },
  },
  { timestamps: true }
);

export default models.Seller || model("Seller", SellerSchema);