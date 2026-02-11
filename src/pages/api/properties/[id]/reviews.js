import dbConnect from "../../../../utils/db";
import Review from "../../../../models/Review";

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await dbConnect();

        // Fetch reviews for the property, sorted by newest
        const reviews = await Review.find({ property_id: id }).sort({ createdAt: -1 });

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
