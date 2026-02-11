import mongoose from 'mongoose';

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  description: { type: String },
  property_type: { type: String, enum: ["apartment", "condo", "studio", "villa", "hotel", "resort"], required: true },
  location: { type: String, required: true },
  city: { type: String, required: true },

  // Deprecated flat fields 
  bedrooms: { type: Number },
  bathrooms: { type: Number },
  area_sqft: { type: Number },
  price_per_month: { type: Number },
  price_per_night: { type: Number },

  amenities: [String],
  images: [String],

  // Multi-Room Support
  rooms: [{
    name: { type: String, required: true }, 
    price_per_night: { type: Number },
    price_per_month: { type: Number },
    capacity: { type: Number, required: true }, 
    count: { type: Number, required: true, default: 1 }, 
    bedrooms: { type: Number, default: 1 },
    bathrooms: { type: Number, default: 1 },
    area_sqft: { type: Number, default: 0 },
    amenities: [String],
    images: [String],
    available: { type: Boolean, default: true }
  }],

  status: { type: String, enum: ["available", "rented", "maintenance"], default: "available" },
  furnishing_status: { type: String, enum: ["furnished", "semi-furnished", "unfurnished"], default: "unfurnished" },
  rental_type: { type: String, enum: ["long_term", "short_term"], default: "long_term" },
  landlord_email: { type: String, required: true },
  offer: {
    enabled: { type: Boolean, default: false },
    required_duration: { type: Number }, 
    discount_percentage: { type: Number }
  },
  rating: { type: Number, default: 0 },
  review_count: { type: Number, default: 0 }
}, { timestamps: true });

if (mongoose.models.Property) {
  delete mongoose.models.Property;
}

export default mongoose.model("Property", PropertySchema);
