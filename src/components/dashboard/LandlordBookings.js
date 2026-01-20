import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, User, DollarSign, Clock } from 'lucide-react';

export default function LandlordBookings() {
    const { data: bookings = [], isLoading } = useQuery({
        queryKey: ['landlord-bookings'],
        queryFn: async () => fetch('/api/user/landlord-bookings').then(res => res.json()),
    });

    // Filter Logic
    const [filterDate, setFilterDate] = React.useState(""); // YYYY-MM

    const filteredBookings = bookings.filter(booking => {
        if (!filterDate) return true;
        const bookingDate = new Date(booking.start_date);
        const filter = new Date(filterDate);
        return bookingDate.getMonth() === filter.getMonth() &&
            bookingDate.getFullYear() === filter.getFullYear();
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Active</span>;
            case 'confirmed':
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Confirmed</span>;
            case 'completed':
                return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Completed</span>;
            case 'cancelled':
                return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Cancelled</span>;
            default:
                return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-xl h-48 animate-pulse bg-gray-100"></div>
                ))}
            </div>
        );
    }

    if (bookings.length === 0 && !isLoading) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-brand-blue/10">
                <CalendarIcon className="w-12 h-12 text-brand-blue/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-brand-dark mb-2">No Bookings Yet</h3>
                <p className="text-brand-dark/70">When users book your properties, they'll appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Received Bookings ({filteredBookings.length})</h2>
                <input
                    type="month"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-4 py-2 rounded-xl border border-brand-blue/20 bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-blue/50"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-brand-blue/10 overflow-hidden">
                {filteredBookings.map((booking) => (
                    <div key={booking._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        {getStatusBadge(booking.status)}
                                        <span className="text-sm text-gray-500">#{booking._id.slice(-6).toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mt-2">
                                        {booking.property_title}
                                    </h3>
                                    {booking.room_name && (
                                        <p className="text-sm font-medium text-blue-600 mt-1">Room: {booking.room_name}</p>
                                    )}
                                </div>
                            </div>

                            {/* Financial Breakdown */}
                            <div className="mt-6 mb-6 border-t border-b border-gray-100 py-4">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="border-r border-gray-100">
                                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Received</p>
                                        <p className="text-lg font-bold text-gray-900 mt-1">₹{booking.total_amount?.toLocaleString()}</p>
                                    </div>
                                    <div className="border-r border-gray-100">
                                        <p className="text-xs text-red-500 uppercase font-bold tracking-wider">Platform Fee (10%)</p>
                                        <p className="text-lg font-bold text-red-500 mt-1">-₹{(booking.platform_fee || booking.total_amount * 0.10)?.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-green-600 uppercase font-bold tracking-wider">Your Payout</p>
                                        <p className="text-lg font-bold text-green-600 mt-1">
                                            ₹{(booking.landlord_payout_amount || booking.total_amount * 0.90)?.toLocaleString()}
                                        </p>
                                        <span className="inline-block bg-green-50 text-green-700 text-[10px] px-2 py-0.5 rounded-full mt-1 border border-green-100 uppercase font-bold">
                                            {booking.payout_status || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Renter</p>
                                        <p className="font-semibold text-gray-900">{booking.renter_name || booking.renter_email}</p>
                                        <p className="text-xs text-gray-500">{booking.renter_email}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <CalendarIcon className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Timeline</p>
                                        <p className="font-semibold text-gray-900">
                                            {format(parseISO(booking.start_date), 'MMM d, yyyy')} - {booking.end_date ? format(parseISO(booking.end_date), 'MMM d, yyyy') : 'Ongoing'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {booking.duration_days ? `${booking.duration_days} Days` : `${booking.duration_months} Months`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Requested On</p>
                                        <p className="font-semibold text-gray-900">{format(parseISO(booking.createdAt), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
