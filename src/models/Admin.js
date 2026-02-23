import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    role: { type: String, default: 'super_admin' },
    otp_hash: { type: String },
    otp_expiry: { type: Date },
    otp_purpose: { type: String, enum: ['PASSWORD_RESET'] }
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.Admin) {
    delete mongoose.models.Admin;
}

export default mongoose.model("Admin", AdminSchema);
