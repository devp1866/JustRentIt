import dbConnect from '../../../utils/db';
import Property from '../../../models/Property';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const { rental_type } = req.query;
    const filter = {};
    if (rental_type) {
      filter.rental_type = rental_type;
    }
    const properties = await Property.find(filter);
    return res.status(200).json(properties);
  } else if (req.method === "POST") {
    try {
      console.log("Creating property with body:", JSON.stringify(req.body, null, 2));
      const { property_type, rooms } = req.body;

      // Validation for Hotels/Resorts
      if ((property_type === "hotel" || property_type === "resort") && (!rooms || rooms.length === 0)) {
        return res.status(400).json({ message: "Hotels and Resorts must have at least one room type." });
      }

      const newProp = new Property(req.body);
      await newProp.save();
      return res.status(201).json(newProp);
    } catch (error) {
      console.error("Error creating property:", error);
      return res.status(400).json({ message: "Failed to create property", error: error.message });
    }
  }
  return res.status(405).end();
}
