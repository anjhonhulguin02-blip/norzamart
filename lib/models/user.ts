import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'buyer', enum: ['buyer', 'seller', 'admin'] },
  status: { type: String, default: 'active', enum: ['active', 'banned'] },
  avatar: { type: String },
  phone: { type: String },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  emailVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationExpires: { type: Date },
  settings: {
    address: { type: String, default: '' },
    barangay: { type: String, default: '' },
    deliveryNotes: { type: String, default: '' },
    preferredDeliveryTime: { type: String, enum: ['anytime', 'morning', 'afternoon', 'evening'], default: 'anytime' },
    contactlessDelivery: { type: Boolean, default: false },
    preferredPayment: { type: String, enum: ['cod', 'gcash', 'bank'], default: 'cod' },
    notifyOrderUpdates: { type: Boolean, default: true },
    notifyChatMessages: { type: Boolean, default: true },
    notifyPromotions: { type: Boolean, default: false },
    profileVisible: { type: Boolean, default: true },
  },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);