import { Schema, models, model } from "mongoose";

const ConversationSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product" },
    lastMessage: { type: String },
    lastMessageAt: { type: Date, default: Date.now },
    buyerUnread: { type: Number, default: 0 },
    sellerUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ buyer: 1, seller: 1 }, { unique: true });

export default models.Conversation || model("Conversation", ConversationSchema);