import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import Booking from "../../../models/Booking";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    // Admin Security Check
    const { admin_token } = req.cookies;
    if (!admin_token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = JSON.parse(admin_token);
        const isAdmin = await Admin.findOne({ email: decoded.email });
        if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });

        const { booking_id, action } = req.body;

        if (action === 'mark_paid') {
            const booking = await Booking.findByIdAndUpdate(
                booking_id,
                { payout_status: 'paid' },
                { new: true }
            );
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            return res.status(200).json({ message: 'Payout marked as paid', booking });
        }

        return res.status(400).json({ message: 'Invalid action' });

    } catch (error) {
        console.error("Admin payout error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
