import dbConnect from "../../../../utils/db";
import Booking from "../../../../models/Booking";
import Property from "../../../../models/Property";

export default async function handler(req, res) {
    const { id, room_id } = req.query;

    if (req.method !== "GET") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        await dbConnect();

        // 1. Get the Property and determine capacity
        let totalInventory = 1;

        if (room_id) {
            const property = await Property.findById(id);
            if (!property) return res.status(404).json({ message: "Property not found" });

            const room = property.rooms.find(r => r._id.toString() === room_id);
            if (room) {
                totalInventory = room.count || 1;
            }
        }

        // 2. Fetch all active bookings for this scope
        const filter = {
            property_id: id,
            status: { $in: ["confirmed", "active", "paid"] },
        };
        if (room_id) {
            filter.room_id = room_id;
        }

        const bookings = await Booking.find(filter).select("start_date end_date");

        // 3. Calculate Daily Occupancy
        // We will map "YYYY-MM-DD" -> count
        const occupancyMap = {};

        bookings.forEach(booking => {
            const start = new Date(booking.start_date);
            const end = new Date(booking.end_date);

            // Loop through nights (inclusive of start, exclusive of end)
            // Example: Jan 1 to Jan 3 (2 nights: Jan 1, Jan 2)
            // If it's a short term rental. 
            // If long term, end_date might be months away. 
            // We need to be careful with infinite loops if dates are bad, but assuming valid dates.

            let current = new Date(start);
            while (current < end) {
                const dateStr = current.toISOString().split('T')[0];
                occupancyMap[dateStr] = (occupancyMap[dateStr] || 0) + 1;
                current.setDate(current.getDate() + 1);
            }
        });

        // 4. Identify Fully Booked Dates
        const fullyBookedDates = [];
        Object.entries(occupancyMap).forEach(([date, count]) => {
            if (count >= totalInventory) {
                fullyBookedDates.push(date);
            }
        });

        fullyBookedDates.sort();

        // 5. Convert back to ranges (optional, but cleaner for frontend consistency)
        // Or simpler: just return 1-day ranges for every blocked date.
        // { start_date: "2023-01-01", end_date: "2023-01-02" }
        const blockedRanges = fullyBookedDates.map(date => {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            return {
                start_date: start.toISOString(),
                end_date: end.toISOString()
            };
        });

        return res.status(200).json({ bookings: blockedRanges });
    } catch (error) {
        console.error("Error fetching booked dates:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}
