import dbConnect from '../../../../utils/db';
import Notification from '../../../../models/Notification';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../utils/authOptions";

export default async function handler(req, res) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const userEmail = session.user.email;

    if (req.method === 'GET') {
        try {
            const notifications = await Notification.find({ user_email: userEmail })
                .sort({ createdAt: -1 })
                .limit(50); // limit to recent 50
            return res.status(200).json(notifications);
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    } 
    
    else if (req.method === 'PUT') {
        // Mark all as read
        try {
            await Notification.updateMany(
                { user_email: userEmail, is_read: false },
                { $set: { is_read: true } }
            );
            return res.status(200).json({ message: "All notifications marked as read." });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    else if (req.method === 'DELETE') {
        // Clear all notifications
        try {
            await Notification.deleteMany({ user_email: userEmail });
            return res.status(200).json({ message: "All notifications cleared." });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
