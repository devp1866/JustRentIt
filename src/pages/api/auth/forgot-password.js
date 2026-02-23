import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import { generateOTP, hashOTP, verifyOTP } from "../../../lib/otp";
import { sendEmail, getEmailTemplate } from "../../../lib/email";
import bcrypt from "bcryptjs";
import rateLimit from "../../../utils/rateLimit";

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    await dbConnect();

    try {
        // IP Rate Limit: Max 5 requests per minute per IP
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        await limiter.check(5, ip);
    } catch {
        return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    const { action, email, otp, newPassword } = req.body;

    try {
        if (action === "send_otp") {
            if (!email) {
                return res.status(400).json({ error: "Email is required" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                // Security: Don't reveal if user exists
                return res.status(200).json({ message: "If an account exists, an OTP has been sent." });
            }

            // Generate OTP
            const otpCode = generateOTP();
            const otpHash = await hashOTP(otpCode);
            const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

            user.otp_hash = otpHash;
            user.otp_expiry = otpExpiry;
            user.otp_purpose = 'PASSWORD_RESET';
            await user.save();

            // Send Email
            try {
                const emailHtml = getEmailTemplate(otpCode, 'PASSWORD_RESET');
                await sendEmail({
                    to: email,
                    subject: 'Reset Your Password - JustRentIt',
                    html: emailHtml
                });
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
                return res.status(500).json({ error: "Failed to send email" });
            }

            return res.status(200).json({ message: "OTP sent successfully" });
        }

        if (action === "reset_password") {
            if (!email || !otp || !newPassword) {
                return res.status(400).json({ error: "All fields are required" });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: "Password must be at least 8 characters" });
            }

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: "Invalid request" });
            }

            // Check OTP
            if (!user.otp_hash || user.otp_purpose !== 'PASSWORD_RESET') {
                return res.status(400).json({ error: "No reset pending" });
            }

            if (new Date() > new Date(user.otp_expiry)) {
                return res.status(400).json({ error: "OTP has expired" });
            }

            const isValid = await verifyOTP(otp, user.otp_hash);
            if (!isValid) {
                return res.status(400).json({ error: "Invalid OTP" });
            }

            // Update Password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            // Clear OTP
            user.otp_hash = undefined;
            user.otp_expiry = undefined;
            user.otp_purpose = undefined;
            await user.save();

            return res.status(200).json({ message: "Password reset successfully" });
        }

        return res.status(400).json({ error: "Invalid action" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server Error" });
    }
}
