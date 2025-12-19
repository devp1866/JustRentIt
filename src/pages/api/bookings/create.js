import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import crypto from "crypto";
import { addMonths, format } from "date-fns";

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
            duration_days,
            total_amount,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Basic validation
        if (!property_id || !start_date || !total_amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!duration_months && !duration_days) {
            return res.status(400).json({ message: "Missing duration" });
        }

        // Verify Razorpay Signature if payment details are present
        if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(body.toString())
                .digest("hex");

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ message: "Invalid payment signature" });
            }
        } else {
            return res.status(400).json({ message: "Payment details missing" });
        }

        let endDate;
        if (duration_days) {
            const startDateObj = new Date(start_date);
            startDateObj.setDate(startDateObj.getDate() + duration_days);
            endDate = format(startDateObj, "yyyy-MM-dd");
        } else {
            endDate = format(addMonths(new Date(start_date), duration_months), "yyyy-MM-dd");
        }

        // Check for overlapping bookings
        const overlappingBooking = await Booking.findOne({
            property_id,
            status: { $in: ["confirmed", "active", "paid"] },
            $or: [
                {
                    start_date: { $lt: endDate },
                    end_date: { $gt: start_date }
                }
            ]
        });

        if (overlappingBooking) {
            return res.status(400).json({ message: "Selected dates are already booked. Please choose different dates." });
        }

        const newBooking = new Booking({
            property_id,
            property_title,
            renter_email: session.user.email,
            renter_name: session.user.name || session.user.email, // Fallback if name is missing
            landlord_email,
            start_date,
            end_date: endDate,
            duration_months: duration_months || 0,
            duration_days: duration_days || 0,
            total_amount,
            status: "confirmed",
            payment_status: "paid",
            payment_date: new Date().toISOString(),
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        });

        await newBooking.save();

        return res.status(201).json({ message: "Booking created successfully", booking: newBooking });

    } catch (error) {
        console.error("Booking creation error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
