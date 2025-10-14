// pages/api/properties/[id].js

import dbConnect from '../../../utils/db';
import Property from '../../../models/Property';

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const property = await Property.findById(id);
      if (!property) return res.status(404).json({ message: "Not found" });
      return res.status(200).json(property);
    } catch {
      return res.status(400).json({ message: "Invalid ID" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await Property.findByIdAndDelete(id);
      return res.status(204).end();
    } catch {
      return res.status(400).json({ message: "Invalid ID" });
    }
  }
  
  return res.status(405).json({ message: "Method not allowed" });
}
