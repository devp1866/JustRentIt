import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  property_id: { type: String, required: true },
  room_id: { type: String },
  room_name: { type: String },
  renter_email: { type: String, required: true },
  renter_name: { type: String },
  start_date: { type: String, required: true },
  end_date: { type: String },
  duration_months: { type: Number },
  duration_days: { type: Number },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "active", "completed", "cancelled"], default: "pending" },
  payment_status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  payment_date: { type: String },
  property_title: { type: String },
  landlord_email: { type: String },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  // Cancellation details
  cancellation_reason: { type: String },
  cancelled_by: { type: String, enum: ["renter", "landlord"] },
  refund_amount: { type: Number },
  refund_amount: { type: Number },
  refund_status: { type: String, enum: ["pending", "processed", "none"] },
  // Commission & Payouts
  guest_service_fee: { type: Number, default: 0 },
  host_processing_fee: { type: Number, default: 0 },
  platform_fee: { type: Number, default: 0 }, // Combined fees
  landlord_payout_amount: { type: Number, default: 0 },
  payout_status: { type: String, enum: ["pending", "paid", "failed", "held"], default: "pending" },
  check_in_confirmed: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

export default mongoose.model("Booking", BookingSchema);
