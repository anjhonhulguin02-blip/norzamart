import { Schema, models, model } from "mongoose";

const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export default models.Subscriber || model("Subscriber", SubscriberSchema);
