import dbConnect from "../../../utils/db";
import User from "../../../models/User";
import { generateOTP, hashOTP } from "../../../lib/otp";
import { sendEmail, getEmailTemplate } from "../../../lib/email";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { full_name, email, password, user_type, phone, city, state, country, govt_id, govt_id_image, preferred_city, budget_range } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const query = { $or: [{ email }] };
    if (phone) {
      query.$or.push({ phone });
    }

    const existingUser = await User.findOne(query);
    if (existingUser) {
      if (!existingUser.is_active) {
        // Check if user was deleted recently
        if (existingUser.deleted_at) {
          const daysSinceDeletion = (new Date() - new Date(existingUser.deleted_at)) / (1000 * 60 * 60 * 24);
          if (daysSinceDeletion < 7) {
            const daysRemaining = Math.ceil(7 - daysSinceDeletion);
            return res.status(400).json({ error: `Account deleted recently. You can recreate your account in ${daysRemaining} days.` });
          } else {
            // Allow recreation: Delete old record so new one can be created
            await User.deleteOne({ _id: existingUser._id });
          }
        } else {
          return res.status(400).json({ error: "Account is inactive or banned." });
        }
      } else {
        return res.status(400).json({ error: "User with this email or phone already exists" });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      full_name,
      email,
      password: hashedPassword, // hashed
      user_type: user_type || "renter",
      phone: phone || undefined,
      is_verified: false, // Force false until verified
      // New fields
      city,
      state,
      country,
      govt_id,
      govt_id_image,
      preferred_city,
      budget_range,
      // OTP
      otp_hash: otpHash,
      otp_expiry: otpExpiry,
      otp_purpose: 'EMAIL_VERIFICATION'
    });

    // Send Email
    try {
      const emailHtml = getEmailTemplate(otp, 'EMAIL_VERIFICATION');
      await sendEmail({
        to: email,
        subject: 'Verify Your Email - JustRentIt',
        html: emailHtml
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // We still return success but maybe warn? Or fail?
      // For now, let's assume it works or user can resend.
    }

    return res.status(201).json({
      message: "User registered. Please verify your email.",
      userId: newUser._id,
      email: newUser.email
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
}
