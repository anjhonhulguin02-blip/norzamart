import { Schema, models, model } from "mongoose";

const SearchLogSchema = new Schema(
  {
    term: { type: String, required: true, unique: true, lowercase: true, trim: true },
    count: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default models.SearchLog || model("SearchLog", SearchLogSchema);
