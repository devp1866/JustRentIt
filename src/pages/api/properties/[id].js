import mongoose from 'mongoose';
import dbConnect from '../../../utils/db';
import Property from '../../../models/Property';
import Booking from '../../../models/Booking';
import EscrowContract from '../../../models/EscrowContract';
import Review from '../../../models/Review';
import DisputeTicket from '../../../models/DisputeTicket';
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
      // 1. Delete the property itself
      const deletedProperty = await Property.findByIdAndDelete(id);
      
      if (!deletedProperty) {
         return res.status(404).json({ message: "Property not found" });
      }

      // 2. Cascade delete all associated dependency documents
      await Promise.all([
        Booking.deleteMany({ property_id: id }),
        EscrowContract.deleteMany({ property_id: id }),
        Review.deleteMany({ property_id: id }),
        DisputeTicket.deleteMany({ property_id: id })
      ]);

      const Notification = (await import("../../../models/Notification")).default;
      await new Notification({
          user_email: deletedProperty.landlord_email,
          type: 'property',
          title: 'Property Deleted',
          message: `Your property "${deletedProperty.title}" and all its associated data have been permanently removed.`,
          link: '/dashboard'
      }).save();

      return res.status(204).end();
    } catch (error) {
      console.error("Error during cascade delete:", error);
      return res.status(500).json({ message: "Cascade deletion failed." });
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

      const Notification = (await import("../../../models/Notification")).default;
      await new Notification({
          user_email: updatedProperty.landlord_email,
          type: 'property',
          title: 'Property Details Updated',
          message: `The details for "${updatedProperty.title}" have been successfully updated.`,
          link: `/property-details/${updatedProperty._id}`
      }).save();

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

      const Notification = (await import("../../../models/Notification")).default;
      // We explicitly check if status changed via PATCH to alert appropriately
      let message = `The details for "${updatedProperty.title}" have been patched/updated.`;
      if (req.body.status && req.body.status === 'maintenance') message = `"${updatedProperty.title}" is now marked as Under Maintenance and removed from public listings.`;
      if (req.body.status && req.body.status === 'available') message = `"${updatedProperty.title}" is now marked as Available and live on the marketplace.`;

      await new Notification({
          user_email: updatedProperty.landlord_email,
          type: 'property',
          title: 'Property Status Updated',
          message: message,
          link: `/property-details/${updatedProperty._id}`
      }).save();

      return res.status(200).json(updatedProperty);
    } catch (error) {
      return res.status(400).json({ message: "Patch failed", error: error.message });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
