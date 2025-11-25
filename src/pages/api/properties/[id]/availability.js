import dbConnect from '../../../../utils/db';
import Booking from '../../../../models/Booking';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        await dbConnect();

        const bookings = await Booking.find({
            property_id: id,
            status: { $in: ["confirmed", "active"] },
        }).select("start_date end_date");

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching availability:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
