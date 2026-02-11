import dbConnect from '../../../utils/db';
import Property from '../../../models/Property';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const { rental_type, property_type, search, price_min, price_max, page = 1, limit = 9 } = req.query;
    const filter = {};
    if (rental_type && rental_type !== 'all') {
      filter.rental_type = rental_type;
    }
    if (property_type && property_type !== 'all') {
      filter.property_type = property_type;
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { city: searchRegex },
        { location: searchRegex }
      ];
    }
    
    if (price_min || price_max) {
      const min = parseInt(price_min) || 0;
      const max = parseInt(price_max) || Infinity;

      
      const priceQuery = { $gte: min };
      if (max !== Infinity) priceQuery.$lte = max;

      filter.$or = filter.$or || [];
      filter.$or.push(
        { price_per_month: priceQuery },
        { price_per_night: priceQuery }
        // Note: This misses Room prices if main price is 0. 
        
      );
      if (filter.$or.length === 0) delete filter.$or;
      if (filter.$or.length === 1 && !search) {
        // simplify if only price 
        delete filter.$or;
      }
    }

    const finalFilter = { ...filter };
    delete finalFilter.$or; 
    const andConditions = [];

    if (rental_type && rental_type !== 'all') andConditions.push({ rental_type });
    if (property_type && property_type !== 'all') andConditions.push({ property_type });

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      andConditions.push({
        $or: [
          { title: searchRegex },
          { city: searchRegex },
          { location: searchRegex }
        ]
      });
    }

    if (price_min || price_max) {
      const min = parseInt(price_min) || 0;
      const max = parseInt(price_max) || Infinity;

      // We will only filter on the main fields.

      const priceCondition = { $gte: min };
      if (max !== Infinity) priceCondition.$lte = max;

      andConditions.push({
        $or: [
          { price_per_month: priceCondition },
          { price_per_night: priceCondition }
        ]
      });
    }

    if (andConditions.length > 0) {
      finalFilter.$and = andConditions;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    try {
      const total = await Property.countDocuments(finalFilter);
      const properties = await Property.find(finalFilter)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(parseInt(limit));

      return res.status(200).json({
        properties,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (e) {
      return res.status(500).json({ message: "Error fetching properties", error: e.message });
    }
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
