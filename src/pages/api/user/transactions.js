import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import EscrowContract from "../../../models/EscrowContract";
import Property from "../../../models/Property";
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
            const userEmail = session.user.email;

            // Fetch all bookings where user is either renter or landlord
            const bookings = await Booking.find({
                $or: [
                    { renter_email: userEmail },
                    { landlord_email: userEmail }
                ]
            }).sort({ createdAt: -1 }).lean();

            let transactions = [];

            for (const booking of bookings) {
                const isRenter = booking.renter_email === userEmail;
                const isLandlord = booking.landlord_email === userEmail;

                // Fetch property title safely
                const property = await Property.findById(booking.property_id).select('title');
                const title = property?.title || booking.property_title || 'Unknown Property';

                if (booking.rental_type === 'long_term') {
                    const escrow = await EscrowContract.findOne({ booking_id: booking._id }).lean();
                    if (escrow) {
                        // 1. Upfront Payment (1st month + Deposit)
                        transactions.push({
                            _id: `${booking._id}_upfront`,
                            booking_id: booking._id,
                            property_title: title,
                            date: booking.createdAt,
                            type: isRenter ? 'outgoing' : 'incoming',
                            amount: (escrow.first_month_rent || 0) + (escrow.deposit_amount || 0),
                            description: `Long Term: Move-in Payment (Deposit + 1st Month)`,
                            status: escrow.first_month_rent_status === 'released' ? 'completed' : 'held_in_escrow'
                        });

                        // 2. Future Escrow Payments
                        if (escrow.payment_schedule && escrow.payment_schedule.length > 0) {
                            for (const payment of escrow.payment_schedule) {
                                transactions.push({
                                    _id: `${booking._id}_month_${payment.month_number}`,
                                    booking_id: booking._id,
                                    property_title: title,
                                    date: payment.due_date,
                                    type: isRenter ? 'outgoing' : 'incoming',
                                    amount: payment.amount,
                                    description: `Long Term: Monthly Rent - Month ${payment.month_number}`,
                                    status: payment.status === 'paid' ? 'completed' : (payment.status === 'pending_payout_to_landlord' ? 'processing' : 'pending')
                                });
                            }
                        }
                    } else {
                        // Fallback if escrow is missing for some reason
                        transactions.push({
                            _id: booking._id.toString(),
                            booking_id: booking._id,
                            property_title: title,
                            date: booking.createdAt,
                            type: isRenter ? 'outgoing' : 'incoming',
                            amount: booking.total_amount,
                            description: `Long Term: Rent Contract`,
                            status: booking.payment_status === 'paid' ? (booking.payout_status === 'paid' ? 'completed' : 'processing') : 'pending'
                        });
                    }
                } else {
                    // Short Term Booking
                    transactions.push({
                        _id: booking._id.toString(),
                        booking_id: booking._id,
                        property_title: title,
                        date: booking.createdAt,
                        type: isRenter ? 'outgoing' : 'incoming',
                        amount: booking.total_amount,
                        description: `Short Term: Stay (${booking.duration_days || '-'} nights)`,
                        status: booking.payment_status === 'paid' ? (booking.payout_status === 'paid' ? 'completed' : 'processing') : 'pending'
                    });
                }

            }

            // Sort by date descending
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            return res.status(200).json({ transactions });
        } catch (error) {
            console.error("Error fetching transactions:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
