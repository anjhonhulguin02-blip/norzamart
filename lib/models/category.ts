import { Schema, models, model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    icon: { type: String, default: "📦" },
  },
  { timestamps: true }
);

export default models.Category || model("Category", CategorySchema);
