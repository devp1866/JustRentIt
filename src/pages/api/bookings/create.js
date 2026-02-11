import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Booking from "../../../models/Booking";
import crypto from "crypto";
import { addMonths, format } from "date-fns";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized. Please sign in." });
    }

    try {
        const session = await dbConnect().then(conn => conn.startSession());
        session.startTransaction();

        try {
            const {
                property_id,
                property_title,
                landlord_email,
                start_date,
                duration_months,
                duration_days,
                total_amount,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                room_id 
            } = req.body;

            if (!property_id || !start_date || !total_amount) {
                await session.abortTransaction();
                return res.status(400).json({ message: "Missing required fields" });
            }

            //keep validation logic, but ensure returns abort transaction
            if (!duration_months && !duration_days) {
                await session.abortTransaction();
                return res.status(400).json({ message: "Missing duration" });
            }

            // Verify Razorpay Signature if payment details are present
            if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
                const body = razorpay_order_id + "|" + razorpay_payment_id;
                const expectedSignature = crypto
                    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                    .update(body.toString())
                    .digest("hex");

                if (expectedSignature !== razorpay_signature) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: "Invalid payment signature" });
                }
            } else {
                await session.abortTransaction();
                return res.status(400).json({ message: "Payment details missing" });
            }

            let endDate;
            if (duration_days) {
                const startDateObj = new Date(start_date);
                startDateObj.setDate(startDateObj.getDate() + duration_days);
                endDate = format(startDateObj, "yyyy-MM-dd");
            } else {
                endDate = format(addMonths(new Date(start_date), duration_months), "yyyy-MM-dd");
            }

            // Check for overlapping bookings
            // Fetch property details to check inventory
            // Lock Property to prevent Write Skew (Double Booking)
            const PropertyModel = (await import("../../../models/Property")).default;
            const property = await PropertyModel.findOneAndUpdate(
                { _id: property_id },
                { $inc: { booking_version: 1 } },
                { session, new: true }
            );

            if (!property) {
                await session.abortTransaction();
                return res.status(404).json({ message: "Property not found" });
            }

            let maxInventory = 1;
            let selectedRoomName = "";

            // Handle Room-Level Inventory for Hotels/Resorts
            if (property.rooms && property.rooms.length > 0) {
                if (!req.body.room_id) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: "Please select a room type." });
                }
                const room = property.rooms.id(req.body.room_id);
                if (!room) {
                    await session.abortTransaction();
                    return res.status(400).json({ message: "Invalid room selected" });
                }
                maxInventory = room.count;
                selectedRoomName = room.name;
            }

            const overlappingBookings = await Booking.find({
                property_id,
                ...(req.body.room_id && { room_id: req.body.room_id }), 
                status: { $in: ["confirmed", "active", "paid"] },
                $or: [
                    {
                        start_date: { $lt: endDate },
                        end_date: { $gt: start_date }
                    }
                ]
            }).session(session); 

           
            const isFullyBooked = () => {
                const requestedStart = new Date(start_date);
                const requestedEnd = new Date(endDate);
                const occupancyMap = {};

                overlappingBookings.forEach(booking => {
                    const bStart = new Date(booking.start_date);
                    const bEnd = new Date(booking.end_date);

                    let current = new Date(bStart < requestedStart ? requestedStart : bStart);
                    const rangeEnd = bEnd > requestedEnd ? requestedEnd : bEnd;

                    while (current < rangeEnd) {
                        const dateStr = current.toISOString().split('T')[0];
                        occupancyMap[dateStr] = (occupancyMap[dateStr] || 0) + 1;
                    
                        current.setDate(current.getDate() + 1);
                    }
                });

                return Object.values(occupancyMap).some(count => count >= maxInventory);
            };

            if (isFullyBooked()) {
                await session.abortTransaction();
                return res.status(409).json({ message: "Selected accommodation is fully booked for specific dates in your range." }); // 409 Conflict
            }

            // Commission  (10%)
            const platform_fee = Math.round(total_amount * 0.10);
            const landlord_payout_amount = total_amount - platform_fee;

            const newBooking = new Booking({
                property_id,
                property_title,
                renter_email: session.user?.email || req.body.renter_email,
                renter_name: session.user?.name || session.user?.email,
                landlord_email,
                start_date,
                end_date: endDate,
                duration_months: duration_months || 0,
                duration_days: duration_days || 0,
                total_amount,
                status: "confirmed",
                payment_status: "paid",
                payment_date: new Date().toISOString(),
                room_id: req.body.room_id,
                room_name: selectedRoomName,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                platform_fee,
                landlord_payout_amount,
                payout_status: "pending"
            });

            await newBooking.save({ session }); 

            await session.commitTransaction(); 

            return res.status(201).json({ message: "Booking created successfully", booking: newBooking });

        } catch (error) {
            await session.abortTransaction();
            console.error("Booking creation error:", error);
            return res.status(500).json({ message: "Internal Server Error", error: error.message });
        } finally {
            session.endSession();
        }
    } catch (outerError) {
        console.error("Session start error:", outerError);
        return res.status(500).json({ message: "Database connection failed" });
    }
}
