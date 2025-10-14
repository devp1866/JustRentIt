import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String },
  user_type: { type: String, default: "renter" },
  // add more fields as needed
});
export default mongoose.models.User || mongoose.model("User", UserSchema);
