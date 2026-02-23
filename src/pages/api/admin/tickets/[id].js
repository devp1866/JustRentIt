import dbConnect from "../../../../utils/db";
import DisputeTicket from "../../../../models/DisputeTicket";
import Admin from "../../../../models/Admin";

export default async function handler(req, res) {
    await dbConnect();

    // Admin Security Check (Cookie-based)
    const { admin_token } = req.cookies;

    if (!admin_token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    let isAdmin;
    try {
        const decoded = JSON.parse(admin_token);
        isAdmin = await Admin.findOne({ email: decoded.email });

        if (!isAdmin) {
            return res.status(403).json({ message: 'Forbidden. Admin access only.' });
        }
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    const { id } = req.query;

    try {
        // Fetch the ticket
        const ticket = await DisputeTicket.findById(id)
            .populate('property_id', 'title location')
            .populate('reporter_id', 'full_name email phone')
            .populate('accused_id', 'full_name email phone');

        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        if (req.method === 'GET') {
            return res.status(200).json({ ticket });
        }

        if (req.method === 'POST') {
            // Send a message or update the ticket state as Admin
            const { action, message, attachments, newStatus } = req.body;

            if (action === 'send_message') {
                if (!message) return res.status(400).json({ message: "Message is required" });

                ticket.chat_logs.push({
                    sender_id: isAdmin._id,
                    sender_role: 'admin',
                    message,
                    attachments: attachments || [],
                    created_at: new Date()
                });

                await ticket.save();
                return res.status(200).json({ message: "Admin message sent", ticket });
            }

            if (action === 'update_status' || action === 'escalate' || action === 'close') {
                if (action === 'close') {
                    ticket.status = 'resolved';
                } else if (newStatus) {
                    ticket.status = newStatus;
                }
                await ticket.save();
                return res.status(200).json({ message: "Status updated", ticket });
            }

            return res.status(400).json({ message: "Invalid action" });
        }

        return res.status(405).json({ message: "Method Not Allowed" });

    } catch (err) {
        console.error("Admin Ticket API error:", err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
