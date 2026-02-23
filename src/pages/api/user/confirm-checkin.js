import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { booking_id } = req.body;

        if (!booking_id) {
            return res.status(400).json({ message: "Missing Booking ID" });
        }

        const booking = await Booking.findById(booking_id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.renter_email !== session.user.email) {
            return res.status(403).json({ message: "Not authorized to confirm check-in" });
        }

        if (booking.check_in_confirmed) {
            return res.status(400).json({ message: "Check-in already confirmed" });
        }

        booking.check_in_confirmed = true;

        // Only auto-release if not escrow (escrow has its own move-in flow)
        // Set it directly to "paid" since the funds are released to landlord
        booking.payout_status = "paid";

        await booking.save();

        return res.status(200).json({ message: "Check-in confirmed successfully. Payment released to landlord." });

    } catch (error) {
        console.error("Check-in confirmation error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
