import { Schema, models, model } from "mongoose";

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    audience: { type: String, enum: ["all", "buyers", "sellers"], default: "all" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default models.Announcement || model("Announcement", AnnouncementSchema);
