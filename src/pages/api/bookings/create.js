import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized. Please sign in." });
    }

    try {
        await dbConnect();

        const {
            property_id,
            property_title,
            landlord_email,
            start_date,
            duration_months,
            total_amount
        } = req.body;

        // Basic validation
        if (!property_id || !start_date || !duration_months || !total_amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newBooking = new Booking({
            property_id,
            property_title,
            renter_email: session.user.email,
            renter_name: session.user.name || session.user.email, // Fallback if name is missing
            landlord_email,
            start_date,
            duration_months,
            total_amount,
            status: "confirmed", // Auto-confirm for demo purposes
            payment_status: "paid", // Mock payment success
            payment_date: new Date().toISOString()
        });

        await newBooking.save();

        return res.status(201).json({ message: "Booking created successfully", booking: newBooking });

    } catch (error) {
        console.error("Booking creation error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
