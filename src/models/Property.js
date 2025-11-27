import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  property_type: { type: String, enum: ["apartment", "house", "condo", "studio", "villa", "pg", "hotel", "resort"], required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area_sqft: { type: Number },
  price_per_month: { type: Number },
  price_per_night: { type: Number },
  amenities: [String],
  images: [String],
  status: { type: String, enum: ["available", "rented", "maintenance"], default: "available" },
  furnishing_status: { type: String, enum: ["furnished", "semi-furnished", "unfurnished"], default: "unfurnished" },
  rental_type: { type: String, enum: ["long_term", "short_term"], default: "long_term" },
  landlord_email: { type: String, required: true },
  offer: {
    enabled: { type: Boolean, default: false },
    required_duration: { type: Number }, // days for short_term, months for long_term
    discount_percentage: { type: Number }
  }
}, { timestamps: true });

if (mongoose.models.Property) {
  delete mongoose.models.Property;
}

export default mongoose.model("Property", PropertySchema);
