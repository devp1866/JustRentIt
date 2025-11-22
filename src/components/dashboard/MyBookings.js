// components/dashboard/MyBookings.js

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function MyBookings({ user }) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/user/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-green-600';
      case 'pending':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-blue-600';
      case 'cancelled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        My Bookings ({bookings.length})
      </h2>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-6 w-3/4 mb-4 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-1/2 mb-2 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600 mb-6">Browse properties and make your first booking</p>
          <Link href="/properties">
            <button className="bg-blue-900 hover:bg-blue-800 text-white rounded px-4 py-2">
              Browse Properties
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{booking.property_title}</h3>
                    <span className={`px-3 py-1 rounded text-white font-semibold text-sm ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>
                        Move-in: {format(new Date(booking.start_date), "MMMM d, yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        Total: ${booking.total_amount} ({booking.duration_months} months)
                      </span>
                    </div>
                    {booking.payment_status === 'paid' && booking.payment_date && (
                      <div className="text-green-600 font-medium">
                        ✓ Paid on {format(new Date(booking.payment_date), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Link href={`/property-details?id=${booking.property_id}`}>
                    <button className="border rounded px-4 py-2 bg-white">
                      View Property
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
