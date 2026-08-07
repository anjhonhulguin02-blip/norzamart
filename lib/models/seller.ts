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
  },
  { timestamps: true }
);

export default models.Seller || model("Seller", SellerSchema);