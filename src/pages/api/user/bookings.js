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

            // Auto-update statuses based on dates
            const now = new Date();
            const bookingsToUpdate = [];

            const updatedBookings = bookings.map(booking => {
                let status = booking.status;
                const startDate = new Date(booking.start_date);
                const endDate = booking.end_date ? new Date(booking.end_date) : startDate;

                // Move from confirmed to active (if start date reached and not cancelled)
                if (status === 'confirmed' && now >= startDate && now <= endDate) {
                    status = 'active';
                    bookingsToUpdate.push({ id: booking._id, status: 'active' });
                }
                // Move from active/confirmed to completed (if end date passed)
                else if ((status === 'active' || status === 'confirmed') && now > endDate) {
                    status = 'completed';
                    bookingsToUpdate.push({ id: booking._id, status: 'completed' });
                }

                return { ...booking, status };
            });

            // Perform bulk write updates in background (fire and forget for speed, or await if critical)
            if (bookingsToUpdate.length > 0) {
                await Promise.all(bookingsToUpdate.map(b =>
                    Booking.findByIdAndUpdate(b.id, { status: b.status })
                ));
            }

            // Populate property images manually AND check for existing review
            const bookingsWithImages = await Promise.all(updatedBookings.map(async (booking) => {
                const property = await import("../../../models/Property").then(mod => mod.default.findById(booking.property_id));
                const review = await import("../../../models/Review").then(mod => mod.default.findOne({ booking_id: booking._id }));

                return {
                    ...booking,
                    property_image: property?.images?.[0] || null,
                    property_type: property?.property_type, // Needed for review weighting logic
                    has_review: !!review,
                    review_id: review?._id,
                    review_createdAt: review?.createdAt,
                    review_data: review // Pass full data for editing
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
