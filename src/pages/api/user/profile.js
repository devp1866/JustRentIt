import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import { generateOTP, hashOTP, verifyOTP } from "../../../lib/otp";
import { sendEmail, getEmailTemplate } from "../../../lib/email";
import bcrypt from "bcryptjs";

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
            is_verified: user.is_verified,
            // Landlord specific
            city: user.city,
            state: user.state,
            country: user.country,
            govt_id: user.govt_id,
            govt_id_image: user.govt_id_image,
            property_ownership_proof: user.property_ownership_proof,
            // Renter specific
            preferred_city: user.preferred_city,
            budget_range: user.budget_range
        });
    } else if (req.method === "POST") {
        const { action } = req.body;

        try {
            if (action === "update_profile") {
                const { city, state, country, preferred_city, budget_range } = req.body;
                if (city) user.city = city;
                if (state) user.state = state;
                if (country) user.country = country;
                if (preferred_city) user.preferred_city = preferred_city;
                if (budget_range) user.budget_range = budget_range;

                await user.save();
                return res.status(200).json({ message: "Profile updated successfully" });
            }

            if (action === "change_password") {
                const { oldPassword, newPassword } = req.body;

                if (!oldPassword || !newPassword) {
                    return res.status(400).json({ error: "Missing fields" });
                }

                if (newPassword.length < 8) {
                    return res.status(400).json({ error: "New password must be at least 8 characters" });
                }

                let isValid = false;
                try {
                    isValid = await bcrypt.compare(oldPassword, user.password);
                } catch (e) {

                }

                if (!isValid && user.password === oldPassword) {
                    isValid = true;
                }

                if (!isValid) {
                    return res.status(400).json({ error: "Incorrect current password" });
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
                await user.save();

                return res.status(200).json({ message: "Password changed successfully" });
            }

            if (action === "send_phone_otp") {
                const { phone } = req.body;
                if (!phone || phone.length !== 10) {
                    return res.status(400).json({ error: "Invalid phone number" });
                }

                const otp = generateOTP();
                const otpHash = await hashOTP(otp);
                const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

                user.otp_hash = otpHash;
                user.otp_expiry = otpExpiry;
                user.otp_purpose = "phone_verification";
                await user.save();

                // Send SMS
                const { sendSMS } = await import("../../../lib/sms");
                await sendSMS(`+91${phone}`, `Your JustRentIt verification code is: ${otp}`);

                return res.status(200).json({ message: "OTP sent successfully" });
            }

            if (action === "verify_phone_otp") {
                const { otp, phone } = req.body;

                if (!user.otp_hash || !user.otp_expiry || user.otp_purpose !== "phone_verification") {
                    return res.status(400).json({ error: "No OTP request found" });
                }

                if (new Date() > new Date(user.otp_expiry)) {
                    return res.status(400).json({ error: "OTP expired" });
                }

                const isValid = await verifyOTP(otp, user.otp_hash);
                if (!isValid) {
                    return res.status(400).json({ error: "Invalid OTP" });
                }

                // Verify and Upgrade
                user.phone = phone;
                user.is_verified = true;
                if (user.user_type === "renter") {
                    user.user_type = "both";
                }

                // Clear OTP
                user.otp_hash = undefined;
                user.otp_expiry = undefined;
                user.otp_purpose = undefined;

                await user.save();

                return res.status(200).json({ message: "Profile upgraded successfully" });
            }

            if (action === "update_phone") {
                const { phone } = req.body;
                if (!phone || phone.length !== 10) {
                    return res.status(400).json({ error: "Invalid phone number" });
                }
                user.phone = phone;
                await user.save();
                return res.status(200).json({ message: "Phone updated successfully" });
            }

            if (action === "delete_account") {
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

                await User.deleteOne({ _id: user._id });
                return res.status(200).json({ message: "Account deleted successfully" });
            }

            return res.status(400).json({ error: "Invalid action" });

        } catch (error) {
            console.error("Profile API Error:", error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    } else {
        return res.status(405).json({ error: "Method Not Allowed" });
    }
}