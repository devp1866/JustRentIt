import dbConnect from "../../../utils/db";
import EscrowContract from "../../../models/EscrowContract";
import Booking from "../../../models/Booking";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    await dbConnect();
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { escrow_id } = req.body;

        if (!escrow_id) {
            return res.status(400).json({ message: "Missing Escrow ID" });
        }

        const sessionMongoose = await dbConnect().then(conn => conn.startSession());
        sessionMongoose.startTransaction();

        try {
            const escrow = await EscrowContract.findById(escrow_id).session(sessionMongoose);

            if (!escrow) {
                await sessionMongoose.abortTransaction();
                return res.status(404).json({ message: "Escrow contract not found" });
            }

            if (escrow.renter_email !== session.user.email) {
                await sessionMongoose.abortTransaction();
                return res.status(403).json({ message: "Not authorized to confirm move-in for this booking" });
            }

            if (escrow.move_in_confirmed) {
                await sessionMongoose.abortTransaction();
                return res.status(400).json({ message: "Move-in already confirmed" });
            }

            // Update Escrow
            escrow.move_in_confirmed = true;
            escrow.move_in_confirmed_date = new Date();
            escrow.first_month_rent_status = "released_to_landlord";
            await escrow.save({ session: sessionMongoose });

            // Update associated Booking payout status
            const booking = await Booking.findById(escrow.booking_id).session(sessionMongoose);
            if (booking) {
                booking.payout_status = "pending"; // Now ready to be processed by admin payout chron/script
                await booking.save({ session: sessionMongoose });
            }

            await sessionMongoose.commitTransaction();

            return res.status(200).json({ message: "Move-in confirmed successfully. First month's rent released." });
        } catch (error) {
            await sessionMongoose.abortTransaction();
            console.error("Move-in confirmation error:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        } finally {
            sessionMongoose.endSession();
        }
    } catch (error) {
        console.error("Move-in confirmation outer error:", error);
        return res.status(500).json({ message: "Server configuration error" });
    }
}
