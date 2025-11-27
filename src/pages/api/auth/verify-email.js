import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import { verifyOTP } from "../../../lib/otp";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        await dbConnect();
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.is_verified) {
            return res.status(400).json({ error: "User already verified" });
        }

        // Check if OTP exists and matches purpose
        if (!user.otp_hash || user.otp_purpose !== 'EMAIL_VERIFICATION') {
            return res.status(400).json({ error: "No verification pending" });
        }

        // Check expiry
        if (new Date() > new Date(user.otp_expiry)) {
            return res.status(400).json({ error: "OTP has expired. Please request a new one." });
        }

        // Verify OTP
        const isValid = await verifyOTP(otp, user.otp_hash);
        if (!isValid) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        // Success: Verify user and clear OTP
        user.is_verified = true;
        user.otp_hash = undefined;
        user.otp_expiry = undefined;
        user.otp_purpose = undefined;
        await user.save();

        return res.status(200).json({ message: "Email verified successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server Error" });
    }
}
