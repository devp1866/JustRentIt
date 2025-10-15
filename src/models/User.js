import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store hashed in production!
  user_type: { type: String, default: "renter" }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
