export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`, {
            headers: {
                // Nominatim requires a User-Agent header to prevent abuse
                'User-Agent': 'JustRentIt Application (Local/Vercel) contact: devp1866@gmail.com'
            }
        });

        if (!response.ok) {
            throw new Error(`Nominatim API responded with status ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Geocoding error:', error);
        return res.status(500).json({ message: 'Failed to fetch geocoding data', error: error.message });
    }
}
