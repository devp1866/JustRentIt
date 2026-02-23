import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import EscrowContract from "../../../models/EscrowContract";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    // Admin Security Check
    const { admin_token } = req.cookies;
    if (!admin_token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = JSON.parse(admin_token);
        const isAdmin = await Admin.findOne({ email: decoded.email });
        if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        // Fetch all bookings sorted by newest first
        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .select('property_title renter_name landlord_email renter_email total_amount platform_fee landlord_payout_amount payout_status createdAt duration_months');

        const bookingIds = bookings.map(b => b._id);
        const escrows = await EscrowContract.find({ booking_id: { $in: bookingIds } });

        // Populate renter names manually if missing
        const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
            const b = booking.toObject ? booking.toObject() : booking;
            const escrow = escrows.find(e => e.booking_id.toString() === b._id.toString());
            if (escrow) {
                b.escrow_data = escrow;
            }

            if (!b.renter_name && b.renter_email) {
                const User = mongoose.models.User || mongoose.model("User");
                const renter = await User.findOne({ email: b.renter_email }).select('full_name');
                if (renter) b.renter_name = renter.full_name;
            }
            return b;
        }));

        res.status(200).json({ bookings: enrichedBookings });

    } catch (error) {
        console.error("Admin transactions error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
