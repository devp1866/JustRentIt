import mongoose from 'mongoose';

const EscrowContractSchema = new mongoose.Schema({
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    property_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    renter_email: { type: String, required: true },
    landlord_email: { type: String, required: true },

    // Financial Tracking
    monthly_rent: { type: Number, required: true },
    deposit_amount: { type: Number, required: true },
    first_month_rent: { type: Number, required: true },

    // Status flags
    deposit_status: {
        type: String,
        enum: ["held", "released_to_renter", "released_to_landlord", "disputed"],
        default: "held"
    },
    first_month_rent_status: {
        type: String,
        enum: ["held", "released_to_landlord", "disputed"],
        default: "held"
    },

    // Ongoing Monthly Rent Tracking
    payment_schedule: [{
        month_number: Number,
        due_date: Date,
        amount: Number,
        guest_service_fee: Number,
        host_processing_fee: Number,
        landlord_payout_amount: Number,
        status: {
            type: String,
            enum: ['pending', 'paid', 'overdue', 'pending_payout_to_landlord'],
            default: 'pending'
        },
        payment_id: String,
        paid_date: Date
    }],

    // Renter confirmation
    move_in_confirmed: { type: Boolean, default: false },
    move_in_confirmed_date: { type: Date }

}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.EscrowContract) {
    delete mongoose.models.EscrowContract;
}

export default mongoose.model("EscrowContract", EscrowContractSchema);
