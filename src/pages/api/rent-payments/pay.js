import Razorpay from "razorpay";
import dbConnect from "../../../utils/db";
import EscrowContract from "../../../models/EscrowContract";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_API || process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    try {
        await dbConnect();

        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: "Unauthorized: Please log in." });
        }

        const { escrow_id, month_number } = req.body;

        if (!escrow_id || !month_number) {
            return res.status(400).json({ message: "Escrow ID and Month Number are required" });
        }

        const escrow = await EscrowContract.findById(escrow_id);
        if (!escrow) {
            return res.status(404).json({ message: "Escrow contract not found" });
        }

        if (escrow.renter_email !== session.user.email) {
            return res.status(403).json({ message: "Forbidden: You are not the renter for this contract." });
        }

        const paymentItem = escrow.payment_schedule.find(p => p.month_number === month_number);
        if (!paymentItem) {
            return res.status(404).json({ message: "Payment schedule for this month not found." });
        }

        if (paymentItem.status === 'paid' || paymentItem.status === 'pending_payout_to_landlord') {
            return res.status(400).json({ message: "This month's rent has already been paid." });
        }

        // Subsequent monthly rentals do not charge the 8% upfront platform fee again.
        const base_rent = paymentItem.amount;
        const total_amount = base_rent;

        const options = {
            amount: total_amount * 100, // Amount in paise
            currency: "INR",
            receipt: `escrow_${escrow_id}_m${month_number}`,
        };

        const order = await razorpay.orders.create(options);

        // We do not save to DB immediately here, we wait for successful verification
        res.status(200).json({ order, total_amount, base_rent, guest_service_fee: 0 });
    } catch (error) {
        console.error("Razorpay Order Error (Rent):", error);
        res.status(500).json({ message: "Something went wrong", error: error.message });
    }
}
