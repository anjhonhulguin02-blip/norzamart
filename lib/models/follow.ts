import { Schema, models, model } from "mongoose";

const FollowSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ user: 1, seller: 1 }, { unique: true });

export default models.Follow || model("Follow", FollowSchema);
