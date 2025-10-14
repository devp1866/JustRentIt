import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  property_type: { type: String, enum: ["apartment", "house", "condo", "studio", "villa"], required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area_sqft: { type: Number },
  price_per_month: { type: Number, required: true },
  amenities: [String],
  images: [String],
  status: { type: String, enum: ["available", "rented", "maintenance"], default: "available" },
  landlord_email: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.Property || mongoose.model("Property", PropertySchema);
