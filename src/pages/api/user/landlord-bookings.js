import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import Property from "../../../models/Property";
import EscrowContract from "../../../models/EscrowContract";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        //  Find all properties owned by this user
        const properties = await Property.find({ landlord_email: session.user.email }).select('_id title');
        const propertyIds = properties.map(p => p._id);

        if (propertyIds.length === 0) {
            return res.status(200).json([]);
        }

        //  Find all bookings for these properties
        const bookings = await Booking.find({ property_id: { $in: propertyIds } }).sort({ createdAt: -1 }).lean();

        //  Populate property titles (and check for room names if needed)

        const bookingIds = bookings.map(b => b._id);
        const escrows = await EscrowContract.find({ booking_id: { $in: bookingIds } }).lean();

        const propertyMap = properties.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.title;
            return acc;
        }, {});

        const bookingsWithDetails = bookings.map(booking => {
            const escrow = escrows.find(e => e.booking_id.toString() === booking._id.toString());
            return {
                ...booking,
                property_title: propertyMap[booking.property_id.toString()] || "Unknown Property",
                escrow_data: escrow || null
            };
        });

        return res.status(200).json(bookingsWithDetails);
    } catch (error) {
        console.error("Error fetching landlord bookings:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
