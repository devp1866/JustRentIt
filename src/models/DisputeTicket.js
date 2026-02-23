import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
    sender_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    sender_role: { type: String, enum: ["renter", "landlord", "admin"], required: true },
    message: { type: String, required: true },
    attachments: [{ type: String }], // Array of S3 URLs
    created_at: { type: Date, default: Date.now }
});

const DisputeTicketSchema = new mongoose.Schema({
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    reporter_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporter_role: { type: String, enum: ["renter", "landlord"], required: true },
    accused_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },
    description: { type: String, required: true },
    severity: { type: String, enum: ["high", "critical"], default: "high" }, // Only major issues
    claim_amount: { type: Number, default: 0 },

    status: { type: String, enum: ["open", "under_review", "escalated", "resolved", "closed"], default: "open" },
    resolution: { type: String }, // e.g., "Renter paid full amount", "Admin suspended renter"

    initial_evidence: [{ type: String }], // Array of S3 URLs for initial proof

    chat_logs: [ChatMessageSchema],

    deadline: { type: Date } // 48-hour deadline for responder
}, { timestamps: true });

export default mongoose.models.DisputeTicket || mongoose.model("DisputeTicket", DisputeTicketSchema);
