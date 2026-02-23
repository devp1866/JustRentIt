import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../utils/authOptions";
import dbConnect from "../../../utils/db";
import Admin from "../../../models/Admin";
import Booking from "../../../models/Booking";
import User from "../../../models/User";
import Property from "../../../models/Property";
import DisputeTicket from "../../../models/DisputeTicket";
import EscrowContract from "../../../models/EscrowContract";
import mongoose from "mongoose";

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

    await dbConnect();

    // Admin Security Check (Cookie-based)
    const { admin_token } = req.cookies;

    if (!admin_token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    let isAdmin;

    try {
        const decoded = JSON.parse(admin_token); // Simple parse for now
        isAdmin = await Admin.findOne({ email: decoded.email }); // Double check DB

        if (!isAdmin) {
            return res.status(403).json({ message: 'Forbidden. Admin access only.' });
        }
    } catch (e) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    try {
        // 1. Total Revenue (Sum of platform_fee)
        const revenueResult = await Booking.aggregate([
            { $match: { payment_status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$platform_fee' } } }
        ]);
        const totalRevenue = revenueResult[0]?.total || 0;

        // 2. Total Bookings
        const totalBookings = await Booking.countDocuments({});

        // 3. Active Listings
        const activeListings = await Property.countDocuments({ status: 'available' });

        // Escrow Total Held
        const escrowResult = await EscrowContract.aggregate([
            { $match: { deposit_status: 'held' } },
            { $group: { _id: null, total: { $sum: '$deposit_amount' } } }
        ]);
        const totalEscrowHeld = escrowResult[0]?.total || 0;

        // 4. Recent Transactions
        const recentBookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .select('property_title renter_name renter_email total_amount platform_fee landlord_payout_amount payout_status createdAt');

        const recentBookingIds = recentBookings.map(b => b._id);
        const recentEscrows = await EscrowContract.find({ booking_id: { $in: recentBookingIds } });

        // Manually populate renter information if missing (for older bookings)
        const enrichedBookings = await Promise.all(recentBookings.map(async (booking) => {
            // Convert to plain object to allow modification if it's a Mongoose doc
            const b = booking.toObject ? booking.toObject() : booking;

            const escrow = recentEscrows.find(e => e.booking_id.toString() === b._id.toString());
            if (escrow) {
                b.escrow_data = escrow;
            }

            if (!b.renter_name && b.renter_email) {
                // Assuming you have a User model imported - Wait, I need to check imports.
                // Ah, User model is not imported in stats.js above. I need to add that import first or use mongoose.model('User').
                // Let's use mongoose.connection.model('User') to be safe/lazy or just import it.
                // Actually, let's fix the imports in a separate step if needed, but for now let's try to assume User is registered?
                // No, I should import User. I will do that in the next step.
                // For now, let's just leave the Placeholders.
                // Wait, I can do a lookup here.
                const User = mongoose.models.User || mongoose.model("User");
                const renter = await User.findOne({ email: b.renter_email }).select('full_name');
                if (renter) {
                    b.renter_name = renter.full_name;
                }
            }
            return b;
        }));

        // 5. Escalted Tickets
        const escalatedTickets = await DisputeTicket.find({ status: 'escalated' })
            .populate('property_id', 'title')
            .populate('reporter_id', 'full_name email')
            .populate('accused_id', 'full_name email')
            .sort({ updatedAt: -1 });

        // 6. Chart Data Generation (7 Days, 6 Months, 1 Year)
        const now = new Date();

        // --- Last 7 Days ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        const dailyRevenue = await Booking.aggregate([
            { $match: { payment_status: 'paid', createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: "$createdAt" },
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    revenue: { $sum: "$platform_fee" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);
        const chartData7Days = dailyRevenue.map(item => {
            const date = new Date(item._id.year, item._id.month - 1, item._id.day);
            return {
                name: date.toLocaleDateString('default', { weekday: 'short' }), // Mon, Tue...
                revenue: item.revenue
            };
        });

        // --- Last 6 Months ---
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(now.getMonth() - 6);
        const monthlyRevenue = await Booking.aggregate([
            { $match: { payment_status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    revenue: { $sum: "$platform_fee" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        const chartData6Months = monthlyRevenue.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                name: date.toLocaleString('default', { month: 'short' }),
                revenue: item.revenue
            };
        });

        // --- This Year ---
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const yearlyRevenue = await Booking.aggregate([
            { $match: { payment_status: 'paid', createdAt: { $gte: startOfYear } } },
            {
                $group: {
                    _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
                    revenue: { $sum: "$platform_fee" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);
        const chartDataYear = yearlyRevenue.map(item => {
            const date = new Date(item._id.year, item._id.month - 1);
            return {
                name: date.toLocaleString('default', { month: 'short' }),
                revenue: item.revenue
            };
        });

        return res.status(200).json({
            adminProfile: {
                name: isAdmin.name,
                email: isAdmin.email
            },
            stats: {
                totalRevenue,
                totalBookings,
                activeListings,
                totalEscrowHeld,
                escalatedCount: escalatedTickets.length
            },
            recentBookings: enrichedBookings,
            escalatedTickets,
            charts: {
                sevenDays: chartData7Days,
                sixMonths: chartData6Months,
                thisYear: chartDataYear
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
