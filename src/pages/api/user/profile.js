import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import User from "../../../models/User";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (req.method === "GET") {
        // Return user profile
        return res.status(200).json({
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            user_type: user.user_type,
            is_verified: user.is_verified
        });
    } else if (req.method === "POST") {
        // Handle OTP Verification / Upgrade / Phone Update
        const { action, otp, phone } = req.body;

        if (action === "send_otp") {
            // Mock OTP sending
            console.log(`Sending OTP to ${phone || user.phone}: 123456`);
            return res.status(200).json({ message: "OTP sent successfully" });
        }

        if (action === "verify_otp") {
            // Mock OTP verification
            if (otp === "123456") {
                if (phone) user.phone = phone;
                user.user_type = "both";
                user.is_verified = true;
                await user.save();
                return res.status(200).json({ message: "Profile upgraded successfully", user_type: "both" });
            } else {
                return res.status(400).json({ error: "Invalid OTP" });
            }
        }

        if (action === "update_phone") {
            if (!phone || phone.length !== 10) {
                return res.status(400).json({ error: "Invalid phone number" });
            }
            // Check if phone is already taken by another user
            const existingUser = await User.findOne({ phone });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(409).json({ error: "This phone number is already registered with another account." });
            }

            user.phone = phone;
            user.is_verified = true;
            await user.save();
            return res.status(200).json({ message: "Phone updated successfully" });
        }

        if (action === "delete_account") {
            // Soft delete user
            user.is_active = false;
            await user.save();

            // Cancel active bookings
            const Booking = (await import("../../../models/Booking")).default;
            await Booking.updateMany(
                {
                    renter_email: user.email,
                    status: { $in: ["confirmed", "active", "pending"] }
                },
                {
                    $set: { status: "cancelled" }
                }
            );

            return res.status(200).json({ message: "Account deleted successfully" });
        }

        return res.status(400).json({ error: "Invalid action" });
    } else {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}