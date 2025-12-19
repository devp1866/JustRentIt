import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Review from "../../../models/Review";
import Booking from "../../../models/Booking";
import Property from "../../../models/Property";
import User from "../../../models/User";
import { differenceInHours } from "date-fns";

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        await dbConnect();

        const { review_id, rating, categories, comment } = req.body;

        if (!review_id || !comment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // 1. Fetch Existing Review
        const review = await Review.findById(review_id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }

        // 2. Verify Ownership
        if (review.renter_email !== session.user.email) {
            return res.status(403).json({ message: 'You can only edit your own reviews.' });
        }

        // 3. Verify Timing (12 hours)
        const now = new Date();
        const hoursDiff = differenceInHours(now, new Date(review.createdAt));

        if (hoursDiff > 12) {
            return res.status(400).json({ message: 'Reviews can only be edited within 12 hours of submission.' });
        }

        // 4. Recalculate Rating
        const property = await Property.findById(review.property_id);
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
        };

        let totalScore = 0;
        let totalWeight = 0;

        for (const [key, weight] of Object.entries(weights)) {
            if (categories[key]) {
                totalScore += categories[key] * weight;
                totalWeight += weight;
            }
        }

        const weightedRating = totalWeight > 0 ? parseFloat((totalScore / totalWeight).toFixed(1)) : 0;

        review.rating = weightedRating;
        review.categories = categories;
        review.comment = comment;
        await review.save();

        // 5. Recalculate Property stats (since rating might have changed)
        const propertyReviews = await Review.find({ property_id: review.property_id });
        const propertyAvg = propertyReviews.reduce((acc, r) => acc + r.rating, 0) / propertyReviews.length;

        await Property.findByIdAndUpdate(review.property_id, {
            rating: parseFloat(propertyAvg.toFixed(1)),
            review_count: propertyReviews.length
        });

        // 6. Recalculate Landlord stats
        const landlordReviews = await Review.find({ landlord_email: review.landlord_email });
        const landlordAvg = landlordReviews.reduce((acc, r) => acc + r.rating, 0) / landlordReviews.length;

        await User.findOneAndUpdate({ email: review.landlord_email }, {
            landlord_rating: parseFloat(landlordAvg.toFixed(1)),
            landlord_review_count: landlordReviews.length
        });

        res.status(200).json({ message: 'Review updated successfully', review });

    } catch (error) {
        console.error('Review update error:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
