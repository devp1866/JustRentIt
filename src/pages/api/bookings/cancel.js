import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import { differenceInDays, parseISO } from "date-fns";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { bookingId, reason } = req.body;

    if (!bookingId || !reason) {
        return res.status(400).json({ message: "Missing booking ID or reason" });
    }

    try {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "Booking is already cancelled" });
        }

        const userEmail = session.user.email;
        let cancelledBy = "";
        let refundAmount = 0;
        let refundStatus = "none";

        // Determine who is cancelling
        if (booking.renter_email === userEmail) {
            cancelledBy = "renter";
        } else if (booking.landlord_email === userEmail) {
            cancelledBy = "landlord";
        } else {
            return res.status(403).json({ message: "You are not authorized to cancel this booking" });
        }

        // Calculate Refund
        if (cancelledBy === "landlord") {
            // Landlord cancellation = Full Refund
            refundAmount = booking.total_amount;
            refundStatus = "pending";
        } else {
            // Renter cancellation logic
            const checkInDate = parseISO(booking.start_date);
            const today = new Date();
            const daysUntilCheckIn = differenceInDays(checkInDate, today);

            if (daysUntilCheckIn > 30) {
                refundAmount = booking.total_amount; 
            } else if (daysUntilCheckIn >= 7) {
                refundAmount = booking.total_amount * 0.5; 
            } else if (daysUntilCheckIn >= 3) {
                refundAmount = booking.total_amount * 0.7; 
                refundAmount = 0; 
            }

            if (refundAmount > 0) {
                refundStatus = "pending";
            }
        }

        // Update Booking
        booking.status = "cancelled";
        booking.cancellation_reason = reason;
        booking.cancelled_by = cancelledBy;
        booking.refund_amount = refundAmount;
        booking.refund_status = refundStatus;

        await booking.save();

        return res.status(200).json({
            message: "Booking cancelled successfully",
            refundAmount,
            refundStatus
        });

    } catch (error) {
        console.error("Cancellation Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
