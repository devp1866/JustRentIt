import { getServerSession } from "next-auth";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import DisputeTicket from "../../../models/DisputeTicket";
import User from "../../../models/User";

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'Unauthorized' });

    try {
        await dbConnect();
        const currentUser = await User.findOne({ email: session.user.email });

        if (!currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all tickets where user is either reporter or accused
        const tickets = await DisputeTicket.find({
            $or: [
                { reporter_id: currentUser._id },
                { accused_id: currentUser._id }
            ]
        })
            .populate('property_id', 'title location images')
            .sort({ createdAt: -1 });

        return res.status(200).json({ tickets });

    } catch (err) {
        console.error("List tickets error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
