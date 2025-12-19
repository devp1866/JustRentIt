import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    booking_id: { type: String, required: true, unique: true }, // One review per booking
    property_id: { type: String, required: true },
    renter_email: { type: String, required: true },
    renter_name: { type: String },
    renter_image: { type: String },
    landlord_email: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 }, // Overall Rating
    categories: {
        cleanliness: { type: Number, required: true, min: 1, max: 5 },
        accuracy: { type: Number, required: true, min: 1, max: 5 },
        check_in: { type: Number, max: 5 }, // Optional based on type
        communication: { type: Number, required: true, min: 1, max: 5 },
        location: { type: Number, required: true, min: 1, max: 5 },
        value: { type: Number, required: true, min: 1, max: 5 },
        safety: { type: Number, required: true, min: 1, max: 5 },
        service_staff: { type: Number, max: 5 }, // Optional based on type
        maintenance: { type: Number, required: true, min: 1, max: 5 },
        amenities: { type: Number, required: true, min: 1, max: 5 }
    },
    comment: { type: String, required: true, minlength: 10 },
    is_verified: { type: Boolean, default: true }
}, { timestamps: true });

if (mongoose.models.Review) {
    delete mongoose.models.Review;
}

export default mongoose.model("Review", ReviewSchema);
