import dbConnect from '../../utils/db';
import Property from '../../models/Property';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const properties = await Property.find({});
    return res.status(200).json(properties);
  } else if (req.method === "POST") {
    const newProp = new Property(req.body);
    await newProp.save();
    return res.status(201).json(newProp);
  }
  return res.status(405).end();
}
