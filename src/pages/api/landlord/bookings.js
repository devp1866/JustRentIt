import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import Property from "../../../models/Property";

export default async function handler(req, res) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "GET") {
        try {
            const bookings = await Booking.find({ landlord_email: session.user.email })
                .sort({ createdAt: -1 })
                .lean();

            const bookingsWithDetails = await Promise.all(bookings.map(async (booking) => {
                const property = await Property.findById(booking.property_id).select('title images');
                return {
                    ...booking,
                    property_title: property?.title || 'Unknown Property',
                    property_image: property?.images?.[0] || null
                };
            }));

            return res.status(200).json(bookingsWithDetails);
        } catch (error) {
            console.error("Error fetching landlord bookings:", error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
