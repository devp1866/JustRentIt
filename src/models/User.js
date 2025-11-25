import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: false, unique: true, sparse: true },
  user_type: { type: String, default: "renter" },
  is_verified: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true }
});

// Prevent Mongoose OverwriteModelError
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", UserSchema);
