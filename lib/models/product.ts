import { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    unit: { type: String, enum: ["piece", "kilo", "gram", "pack", "bundle", "liter", "dozen"], default: "piece" },
    image: { type: String },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0 },
    tag: { type: String },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    weight: { type: String },
    origin: { type: String },
    freshUntil: { type: Date },
    availableBarangays: { type: [String], default: [] },
    deliveryFee: { type: Number },
    soldCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);