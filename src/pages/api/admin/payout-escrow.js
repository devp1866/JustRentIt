import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import EscrowContract from "../../../models/EscrowContract";
import Booking from "../../../models/Booking";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    const { admin_token } = req.cookies;
    if (!admin_token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = JSON.parse(admin_token);
        const isAdmin = await Admin.findOne({ email: decoded.email });
        if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const { escrow_id, type } = req.body;

    if (!escrow_id || !type) {
        return res.status(400).json({ message: 'Missing escrow_id or type' });
    }

    try {
        const escrow = await EscrowContract.findById(escrow_id);
        if (!escrow) return res.status(404).json({ message: 'Escrow contract not found' });

        if (type === 'release_rent') {
            if (escrow.first_month_rent_status === 'released_to_landlord') {
                return res.status(400).json({ message: 'Rent already released' });
            }
            escrow.first_month_rent_status = 'released_to_landlord';

            // Mark overall booking payout status
            const booking = await Booking.findById(escrow.booking_id);
            if (booking && escrow.deposit_status !== 'held') {
                booking.payout_status = 'paid';
                await booking.save();
            }
        } else if (type === 'release_deposit_to_renter') {
            if (escrow.deposit_status !== 'held') {
                return res.status(400).json({ message: 'Deposit no longer held' });
            }
            escrow.deposit_status = 'released_to_renter';

            const booking = await Booking.findById(escrow.booking_id);
            if (booking && escrow.first_month_rent_status === 'released_to_landlord') {
                booking.payout_status = 'paid';
                await booking.save();
            }
        } else if (type === 'release_deposit_to_landlord') {
            if (escrow.deposit_status !== 'held') {
                return res.status(400).json({ message: 'Deposit no longer held' });
            }
            escrow.deposit_status = 'released_to_landlord';

            const booking = await Booking.findById(escrow.booking_id);
            if (booking && escrow.first_month_rent_status === 'released_to_landlord') {
                booking.payout_status = 'paid';
                await booking.save();
            }
        } else {
            return res.status(400).json({ message: 'Invalid release type' });
        }

        await escrow.save();
        res.status(200).json({ message: 'Escrow updated successfully', escrow });

    } catch (error) {
        console.error("Admin escrow payout error:", error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
}
