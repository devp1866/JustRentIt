import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import bcrypt from "bcryptjs";
import { serialize } from "cookie";
import rateLimit from "../../../utils/rateLimit";

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        await limiter.check(5, ip); // 5 login attempts per minute
    } catch {
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
    }

    await dbConnect();

    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set secure cookie
        const token = JSON.stringify({ id: admin._id, email: admin.email, role: admin.role }); // Simple payload for now
        const cookie = serialize('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            // maxAge: 60 * 60 * 24, // Removed to create a session cookie (clears on browser close)
            sameSite: 'lax', // Lax is better for top-level navigations
            path: '/'
        });

        res.setHeader('Set-Cookie', cookie);
        return res.status(200).json({ message: 'Login successful' });

    } catch (error) {
        console.error('Admin login error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
