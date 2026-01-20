import { serialize } from 'cookie';

export default function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Clear the admin_token cookie
    const cookie = serialize('admin_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0), // Expire immediately
        sameSite: 'lax',
        path: '/'
    });

    res.setHeader('Set-Cookie', cookie);

    // If it's a regular navigation (GET), redirect to login
    if (req.method === 'GET') {
        return res.redirect('/admin/login');
    }

    // If it's an API call (POST), return JSON
    return res.status(200).json({ message: 'Logged out successfully' });
}
