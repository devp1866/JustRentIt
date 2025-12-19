import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false, unique: true, sparse: true },
  user_type: { type: String, default: "renter" },
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  deleted_at: { type: Date },
  // Landlord specific
  city: { type: String },
  state: { type: String },
  country: { type: String },
  govt_id: { type: String },
  govt_id_image: { type: String },
  property_ownership_proof: { type: String },
  // Renter specific
  preferred_city: { type: String },
  budget_range: { type: String },
  // OTP Verification
  otp_hash: { type: String },
  otp_expiry: { type: Date },
  otp_purpose: { type: String },
  // Review System
  landlord_rating: { type: Number, default: 0 },
  landlord_review_count: { type: Number, default: 0 }
});

// Prevent Mongoose OverwriteModelError
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", UserSchema);
