import mongoose from 'mongoose';
import dbConnect from '../../../utils/db';
import Property from '../../../models/Property';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const property = await Property.findById(id);

      if (!property) return res.status(404).json({ message: "Not found" });

      // Check session to see if requesting user is the landlord
      const session = await getServerSession(req, res, authOptions);
      const user = session?.user;

      if (!user || user.email !== property.landlord_email) {
        property.landlord_email = undefined;
      }

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

  if (req.method === "PUT") {
    try {
      const updatedProperty = await Property.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updatedProperty) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.status(200).json(updatedProperty);
    } catch (error) {
      return res.status(400).json({ message: "Update failed", error: error.message });
    }
  }

  if (req.method === "PATCH") {
    try {
      const updatedProperty = await Property.findByIdAndUpdate(id, { $set: req.body }, {
        new: true,
        runValidators: true,
      });
      if (!updatedProperty) {
        return res.status(404).json({ message: "Not found" });
      }
      return res.status(200).json(updatedProperty);
    } catch (error) {
      return res.status(400).json({ message: "Patch failed", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
