import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Review from "../../../models/Review";
import Booking from "../../../models/Booking";
import Property from "../../../models/Property";
import User from "../../../models/User";
import { parseISO, addDays, isAfter, isBefore, startOfDay } from "date-fns";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await dbConnect();

        const { booking_id, rating, categories, comment } = req.body;

        // 1. Validate Input
        if (!booking_id || !comment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        if (comment.length < 10) {
            return res.status(400).json({ message: 'Review comment must be at least 10 characters long.' });
        }

        // 2. Fetch Booking
        const booking = await Booking.findById(booking_id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // 3. Verify User Ownership
        if (booking.renter_email !== session.user.email) {
            return res.status(403).json({ message: 'You can only review your own bookings.' });
        }

        // 4. Fetch Property for Type & Verify Timing
        const property = await Property.findById(booking.property_id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Assuming dates are stored as ISO strings
        const now = new Date();
        const startDate = parseISO(booking.start_date);
        const endDate = booking.end_date ? parseISO(booking.end_date) : startDate;
        const reviewDeadline = addDays(endDate, 3);

        if (isBefore(now, startOfDay(startDate))) {
            return res.status(400).json({ message: 'You cannot review a property before your move-in date.' });
        }
        if (isAfter(now, reviewDeadline)) {
            return res.status(400).json({ message: 'Review period has expired (3 days after move-out).' });
        }

        // 5. Calculate Weighted Rating
        // Group A (Serviced): Hotel, Resort, PG, Villa
        // Group B (Private): Apartment, House, Condo, Studio
        const isGroupA = ["hotel", "resort", "pg", "villa"].includes(property.property_type?.toLowerCase());

        const weights = isGroupA ? {
            cleanliness: 0.20,
            safety: 0.15,
            service_staff: 0.15,
            amenities: 0.10,
            accuracy: 0.10,
            value: 0.10,
            communication: 0.10,
            location: 0.05,
            maintenance: 0.05
            // check_in: 0
        } : {
            cleanliness: 0.20,
            safety: 0.15,
            maintenance: 0.15,
            amenities: 0.10,
            accuracy: 0.10,
            value: 0.10,
            communication: 0.10,
            location: 0.05,
            check_in: 0.05
            // service_staff: 0
        };

        let totalScore = 0;
        let totalWeight = 0;

        for (const [key, weight] of Object.entries(weights)) {
            if (categories[key]) {
                totalScore += categories[key] * weight;
                totalWeight += weight;
            }
        }

        // Normalize if missing optional categories (though frontend should enforce)
        const weightedRating = totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(1)) : 0;

        // 6. Check Duplicate
        const existingReview = await Review.findOne({ booking_id });
        if (existingReview) {
            return res.status(400).json({ message: 'You have already reviewed this booking.' });
        }

        // 7. Create Review
        const review = await Review.create({
            booking_id,
            property_id: booking.property_id,
            renter_email: session.user.email,
            renter_name: session.user.name || booking.renter_name || "JustRentIt User",
            renter_image: session.user.image,
            landlord_email: booking.landlord_email,
            rating: weightedRating, // Calculated
            categories,
            comment,
            is_verified: true
        });

        // 7. Update Property stats
        const propertyReviews = await Review.find({ property_id: booking.property_id });
        const propertyAvg = propertyReviews.reduce((acc, r) => acc + r.rating, 0) / propertyReviews.length;

        await Property.findByIdAndUpdate(booking.property_id, {
            rating: parseFloat(propertyAvg.toFixed(1)),
            review_count: propertyReviews.length
        });

        // 8. Update Landlord stats
        const landlordReviews = await Review.find({ landlord_email: booking.landlord_email });
        const landlordAvg = landlordReviews.reduce((acc, r) => acc + r.rating, 0) / landlordReviews.length;

        await User.findOneAndUpdate({ email: booking.landlord_email }, {
            landlord_rating: parseFloat(landlordAvg.toFixed(1)),
            landlord_review_count: landlordReviews.length
        });

        res.status(201).json({ message: 'Review submitted successfully', review });

    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
