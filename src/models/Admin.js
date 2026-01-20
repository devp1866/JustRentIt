import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    role: { type: String, default: 'super_admin' },
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.Admin) {
    delete mongoose.models.Admin;
}

export default mongoose.model("Admin", AdminSchema);
