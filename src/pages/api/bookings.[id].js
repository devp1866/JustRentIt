import dbConnect from '../../../utils/db';
import Booking from '../../../models/Booking';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const booking = await Booking.findById(id);
      if (!booking) return res.status(404).json({ message: "Not found" });
      return res.status(200).json(booking);
    } catch {
      return res.status(400).json({ message: "Invalid ID" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await Booking.findByIdAndDelete(id);
      return res.status(204).end();
    } catch {
      return res.status(400).json({ message: "Invalid ID" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
