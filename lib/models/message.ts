import { Schema, models, model } from "mongoose";

const MessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderName: { type: String, required: true },
    text: { type: String, default: "" },
    image: { type: String },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default models.Message || model("Message", MessageSchema);