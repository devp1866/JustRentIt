import { getServerSession } from "next-auth";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import DisputeTicket from "../../../models/DisputeTicket";
import User from "../../../models/User";

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ message: 'Unauthorized' });

    await dbConnect();
    const { id } = req.query;

    try {
        const currentUser = await User.findOne({ email: session.user.email });
        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        // Fetch the ticket
        const ticket = await DisputeTicket.findById(id)
            .populate('property_id', 'title location')
            .populate('reporter_id', 'full_name email phone')
            .populate('accused_id', 'full_name email phone');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        const isReporter = ticket.reporter_id._id.toString() === currentUser._id.toString();
        const isAccused = ticket.accused_id._id.toString() === currentUser._id.toString();

        // Check if the user is part of the ticket (or an admin)
        if (!isReporter && !isAccused && currentUser.role !== "admin") {
            return res.status(403).json({ message: 'Forbidden' });
        }

        if (req.method === 'GET') {
            return res.status(200).json({ ticket });
        }

        if (req.method === 'POST') {
            // Send a message or update the ticket state
            const { action, message, attachments, newStatus } = req.body;

            if (action === "send_message") {
                if (!message) return res.status(400).json({ message: "Message is required" });

                const role = isReporter ? ticket.reporter_role : (isAccused ? (ticket.reporter_role === "renter" ? "landlord" : "renter") : "admin");

                ticket.chat_logs.push({
                    sender_id: currentUser._id,
                    sender_role: role,
                    message,
                    attachments: attachments || [],
                    created_at: new Date()
                });

                await ticket.save();
                return res.status(200).json({ message: "Message sent", ticket });
            }

            if (action === "update_status") {
                // Only admins or responding parties under certain conditions
                if (newStatus === "escalated" || newStatus === "resolved") {
                    ticket.status = newStatus;
                    await ticket.save();
                    return res.status(200).json({ message: "Status updated", ticket });
                }
                return res.status(400).json({ message: "Invalid status update" });
            }

            return res.status(400).json({ message: "Invalid action" });
        }

        return res.status(405).json({ message: "Method Not Allowed" });

    } catch (err) {
        console.error("Ticket API error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
