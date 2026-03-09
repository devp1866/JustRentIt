import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    user_email: { type: String, required: true },
    type: {
        type: String,
        enum: ['booking', 'payment', 'property', 'system'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    is_read: { type: Boolean, default: false },
    link: { type: String } // Optional link to redirect user on click
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

export default mongoose.model("Notification", NotificationSchema);
