import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  property_id: { type: String, required: true },
  renter_email: { type: String, required: true },
  renter_name: { type: String },
  start_date: { type: String, required: true },
  end_date: { type: String }, // Calculated from start_date + duration_months
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
  refund_status: { type: String, enum: ["pending", "processed", "none"] }
}, { timestamps: true });

// Prevent Mongoose OverwriteModelError
if (mongoose.models.Booking) {
  delete mongoose.models.Booking;
}

export default mongoose.model("Booking", BookingSchema);
