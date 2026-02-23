import crypto from "crypto";
import dbConnect from "../../../utils/db";
import EscrowContract from "../../../models/EscrowContract";
import Booking from "../../../models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

    try {
        await dbConnect();

        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            escrow_id,
            month_number,
            base_rent,
            guest_service_fee
        } = req.body;

        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const escrow = await EscrowContract.findById(escrow_id);
        if (!escrow) {
            return res.status(404).json({ message: "Escrow contract not found" });
        }

        const scheduleIndex = escrow.payment_schedule.findIndex(p => p.month_number === month_number);
        if (scheduleIndex === -1) {
            return res.status(404).json({ message: "Payment schedule not found" });
        }

        // Calculate payout values for the landlord
        const host_processing_fee = Math.round(base_rent * 0.03); // 3% fee
        const landlord_payout_amount = base_rent - host_processing_fee;
        const platform_fee_total = guest_service_fee + host_processing_fee;

        // Update the payment schedule
        escrow.payment_schedule[scheduleIndex].status = "pending_payout_to_landlord";
        escrow.payment_schedule[scheduleIndex].payment_id = razorpay_payment_id;
        escrow.payment_schedule[scheduleIndex].paid_date = new Date();
        escrow.payment_schedule[scheduleIndex].guest_service_fee = guest_service_fee;
        escrow.payment_schedule[scheduleIndex].host_processing_fee = host_processing_fee;
        escrow.payment_schedule[scheduleIndex].landlord_payout_amount = landlord_payout_amount;

        await escrow.save();

        // Update global booking stats
        const booking = await Booking.findById(escrow.booking_id);
        if (booking) {
            booking.platform_fee = (booking.platform_fee || 0) + platform_fee_total;
            await booking.save();
        }

        res.status(200).json({ message: "Payment verified successfully", escrow });
    } catch (error) {
        console.error("Rent verification error:", error);
        res.status(500).json({ message: "Payment verification failed", error: error.message });
    }
}
