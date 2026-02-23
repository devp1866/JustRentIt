import { getServerSession } from "next-auth";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import DisputeTicket from "../../../models/DisputeTicket";
import User from "../../../models/User";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'Unauthorized' });

    try {
        await dbConnect();

        const { booking_id, title, description, severity, claim_amount, initial_evidence } = req.body;

        if (!booking_id || !title || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const booking = await Booking.findById(booking_id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Determine roles
        const isRenter = session.user.email === booking.renter_email;
        const isLandlord = session.user.email === booking.landlord_email;

        if (!isRenter && !isLandlord) {
            return res.status(403).json({ message: 'You are not a party to this booking.' });
        }

        const reporter_role = isRenter ? "renter" : "landlord";
        const accused_email = isRenter ? booking.landlord_email : booking.renter_email;

        // Check deadlines: 7 Days after checkout for Landlords 
        if (isLandlord) {
            const checkoutDate = new Date(booking.end_date);
            const sevenDaysAfter = new Date(checkoutDate);
            sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);

            if (new Date() > sevenDaysAfter) {
                return res.status(400).json({ message: "Disputes must be filed within 7 days of checkout." });
            }
        }

        // We need the accused user's ID
        const User = (await import("../../../models/User")).default;
        const accusedUser = await User.findOne({ email: accused_email });
        const reporterUser = await User.findOne({ email: session.user.email });

        if (!accusedUser || !reporterUser) {
            return res.status(404).json({ message: 'User records not found' });
        }

        // Calculate 48-hour deadline for responder
        const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

        const ticket = new DisputeTicket({
            booking_id,
            property_id: booking.property_id,
            reporter_id: reporterUser._id,
            reporter_role,
            accused_id: accusedUser._id,
            title,
            description,
            severity: severity || "high",
            claim_amount: claim_amount || 0,
            initial_evidence: initial_evidence || [],
            deadline
        });

        await ticket.save();

        return res.status(201).json({ message: 'Dispute ticket created', ticket });

    } catch (err) {
        console.error("Create ticket error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
