import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema({
  property_id: { type: String, required: true },
  renter_email: { type: String, required: true },
  renter_name: { type: String },
  start_date: { type: String, required: true },
  duration_months: { type: Number, required: true },
  total_amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "confirmed", "active", "completed", "cancelled"], default: "pending" },
  payment_status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  payment_date: { type: String },
  property_title: { type: String },
  landlord_email: { type: String }
}, { timestamps: true });

export default mongoose.models.Booking || mongoose.model("Booking", BookingSchema);
