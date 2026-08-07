import { Schema, models, model } from "mongoose";

const AddressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    label: { type: String, required: true },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    barangay: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Address || model("Address", AddressSchema);
