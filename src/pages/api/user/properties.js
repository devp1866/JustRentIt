import dbConnect from "../../../utils/db";
import Property from "../../../models/Property";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.method === "GET") {
        try {
            // Fetch properties where the user is the landlord
            const email = session.user.email;
            if (!email) {
                return res.status(400).json({ message: "User email not found in session" });
            }

            // Case-insensitive search for landlord_email, ignoring surrounding whitespace
            const escapedEmail = email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const properties = await Property.find({
                landlord_email: { $regex: new RegExp(`^\\s*${escapedEmail}\\s*$`, 'i') }
            }).sort({ createdAt: -1 });

            return res.status(200).json(properties);
        } catch (error) {
            console.error("Error fetching properties:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }

    return res.status(405).json({ message: "Method not allowed" });
}
