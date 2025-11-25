import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "GET") {
        try {
            // Fetch bookings where the user is the renter
            const bookings = await Booking.find({ renter_email: session.user.email }).sort({ createdAt: -1 }).lean();

            // Populate property images manually
            const bookingsWithImages = await Promise.all(bookings.map(async (booking) => {
                const property = await import("../../../models/Property").then(mod => mod.default.findById(booking.property_id));
                return {
                    ...booking,
                    property_image: property?.images?.[0] || null
                };
            }));

            return res.status(200).json(bookingsWithImages);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
