// components/dashboard/MyBookings.js

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, MapPin, DollarSign } from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

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

  const [filterDate, setFilterDate] = React.useState("");

  const filteredBookings = bookings.filter(booking => {
    if (!filterDate) return true;
    const bookingDate = new Date(booking.start_date);
    const [year, month] = filterDate.split('-');
    return bookingDate.getFullYear() === parseInt(year) && bookingDate.getMonth() + 1 === parseInt(month);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          My Bookings ({filteredBookings.length})
        </h2>
        <input
          type="month"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
      </div>

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
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6">
            {filterDate ? "Try changing the date filter" : "Browse properties and make your first booking"}
          </p>
          {!filterDate && (
            <Link href="/properties">
              <button className="bg-blue-900 hover:bg-blue-800 text-white rounded px-4 py-2">
                Browse Properties
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-100">
              <div className="flex flex-col md:flex-row">
                {/* Property Image */}
                <div className="md:w-48 h-48 md:h-auto relative">
                   <div className="w-full h-full relative">
                     <Image 
                       src={booking.property_image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"} 
                       alt={booking.property_title}
                       fill
                       className="object-cover"
                     />
                   </div>
                   <div className="absolute top-2 left-2 z-10">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                   </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{booking.property_title}</h3>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900">₹{booking.total_amount}</p>
                        <p className="text-xs text-gray-500">Total Paid</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-blue-900 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Move-in</p>
                          <p className="text-sm text-gray-600">{format(new Date(booking.start_date), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-blue-900 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Move-out</p>
                          <p className="text-sm text-gray-600">
                            {booking.end_date ? format(new Date(booking.end_date), "MMM d, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                         <DollarSign className="w-5 h-5 text-blue-900 mt-0.5" />
                         <div>
                           <p className="text-sm font-medium text-gray-900">Rate</p>
                           <p className="text-sm text-gray-600">
                             {booking.duration_days 
                               ? `${booking.duration_days} Nights` 
                               : `${booking.duration_months} Months`}
                           </p>
                         </div>
                      </div>
                       <div className="flex items-start gap-3">
                         <MapPin className="w-5 h-5 text-blue-900 mt-0.5" />
                         <div>
                           <p className="text-sm font-medium text-gray-900">Landlord</p>
                           <p className="text-sm text-gray-600">{booking.landlord_email}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                     <div className="flex items-center gap-2">
                        {booking.payment_status === 'paid' ? (
                          <span className="flex items-center text-green-600 text-sm font-medium">
                            <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                            Payment Successful
                          </span>
                        ) : (
                           <span className="flex items-center text-yellow-600 text-sm font-medium">
                            <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                            Payment Pending
                          </span>
                        )}
                     </div>
                     <Link href={`/property-details/${booking.property_id}`}>
                        <button className="text-blue-900 font-semibold hover:text-blue-700 text-sm transition-colors">
                          View Property Details →
                        </button>
                     </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
