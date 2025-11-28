import { sendEmail } from "../../lib/email";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Construct email body
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>New Contact Message</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <hr />
                <h3>Message:</h3>
                <p style="white-space: pre-wrap;">${message}</p>
            </div>
        `;

        // Send email to the admin/support (using the same email user for now as destination)
        // In a real app, this might be a specific support email address.
        await sendEmail({
            to: process.env.EMAIL_USER,
            subject: `Contact Form: ${subject}`,
            html
        });

        return res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Contact API Error:', error);
        return res.status(500).json({ error: 'Failed to send message' });
    }
}
