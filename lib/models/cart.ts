import { Schema, models, model } from "mongoose";

const CartItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { timestamps: true }
);

CartItemSchema.index({ user: 1, product: 1 }, { unique: true });

export default models.CartItem || model("CartItem", CartItemSchema);