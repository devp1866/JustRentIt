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

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ message: "Notification ID is required." });
    }

    // Verify ownership
    const notification = await Notification.findById(id);
    if (!notification) {
        return res.status(404).json({ message: "Notification not found." });
    }
    
    if (notification.user_email !== session.user.email) {
         return res.status(403).json({ message: "Forbidden" });
    }

    if (req.method === 'PUT') {
        // Mark single as read
        try {
            notification.is_read = true;
            await notification.save();
            return res.status(200).json(notification);
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    else if (req.method === 'DELETE') {
        // Delete single notification
        try {
            await Notification.findByIdAndDelete(id);
            return res.status(200).json({ message: "Notification deleted." });
        } catch (error) {
            return res.status(500).json({ message: "Server Error", error: error.message });
        }
    }

    else {
        res.setHeader('Allow', ['PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
