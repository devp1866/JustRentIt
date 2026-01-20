import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    // Admin Security Check (Cookie-based)
    const { admin_token } = req.cookies;

    if (!admin_token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = JSON.parse(admin_token);
        const admin = await Admin.findOne({ email: decoded.email });

        if (!admin) {
            return res.status(403).json({ message: 'Forbidden. Admin access only.' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        admin.password = hashedPassword;
        await admin.save();

        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error("Change password error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
