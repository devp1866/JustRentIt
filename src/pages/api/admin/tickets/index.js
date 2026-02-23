import dbConnect from "../../../../utils/db";
import DisputeTicket from "../../../../models/DisputeTicket";
import Admin from "../../../../models/Admin";

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    // Admin Security Check
    const { admin_token } = req.cookies;
    if (!admin_token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = JSON.parse(admin_token);
        const isAdmin = await Admin.findOne({ email: decoded.email });
        if (!isAdmin) return res.status(403).json({ message: 'Forbidden' });
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        const tickets = await DisputeTicket.find({})
            .populate('property_id', 'title location')
            .populate('reporter_id', 'full_name email')
            .populate('accused_id', 'full_name email')
            .sort({ updatedAt: -1 });

        return res.status(200).json({ tickets });
    } catch (err) {
        console.error("Fetch all tickets error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
