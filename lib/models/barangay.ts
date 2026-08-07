import { Schema, models, model } from "mongoose";

const BarangaySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default models.Barangay || model("Barangay", BarangaySchema);
