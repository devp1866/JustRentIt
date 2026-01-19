import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, User, DollarSign, Clock } from 'lucide-react';

export default function LandlordBookings() {
    const { data: bookings = [], isLoading, isError } = useQuery({
        queryKey: ['landlord-bookings'],
        queryFn: async () => {
            const res = await fetch('/api/landlord/bookings');
            if (!res.ok) throw new Error('Failed to fetch bookings');
            return res.json();
        },
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

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No bookings received yet</h3>
                <p className="text-gray-500">When someone books your property, it will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Received Bookings ({bookings.length})</h2>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {bookings.map((booking) => (
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
                                <div className="mt-4 md:mt-0 text-right">
                                    <div className="text-2xl font-bold text-blue-600">₹{booking.total_amount}</div>
                                    <div className="text-sm text-gray-500">Total Income</div>
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
