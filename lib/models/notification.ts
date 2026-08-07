import { Schema, models, model } from "mongoose";

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["order_status", "new_message", "new_review", "seller_new_order", "payout_update"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Notification || model("Notification", NotificationSchema);