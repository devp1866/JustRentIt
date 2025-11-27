import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, MapPin, DollarSign, AlertTriangle } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import Image from "next/image";

export default function MyBookings({ user }) {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [refundEstimate, setRefundEstimate] = useState(0);
  const [reason, setReason] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: async () => {
      const res = await fetch('/api/user/bookings');
      if (!res.ok) throw new Error('Failed to fetch bookings');
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-bookings"]);
      setShowCancelModal(false);
      setReason("");
      setSelectedBooking(null);
      alert("Booking cancelled successfully");
    },
    onError: (err) => {
      alert(err.message);
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

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);

    // Calculate estimated refund
    const checkInDate = parseISO(booking.start_date);
    const today = new Date();
    const daysUntilCheckIn = differenceInDays(checkInDate, today);
    let amount = 0;

    if (daysUntilCheckIn > 30) {
      amount = booking.total_amount;
    } else if (daysUntilCheckIn >= 7) {
      amount = booking.total_amount * 0.5;
    } else if (daysUntilCheckIn >= 3) {
      amount = booking.total_amount * 0.7;
    } else {
      amount = 0;
    }

    setRefundEstimate(amount);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for cancellation.");
      return;
    }
    cancelMutation.mutate({ bookingId: selectedBooking._id, reason });
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

                  {booking.status === "cancelled" && (
                    <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                      <p className="font-semibold text-red-800 mb-1">Cancellation Details:</p>
                      <p className="text-red-700"><span className="font-medium">Reason:</span> {booking.cancellation_reason}</p>
                      <p className="text-red-700"><span className="font-medium">Refund Status:</span> {booking.refund_status} (₹{booking.refund_amount})</p>
                    </div>
                  )}

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
                    <div className="flex gap-3">
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleCancelClick(booking)}
                          className="text-red-600 font-semibold hover:text-red-800 text-sm transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                      <Link href={`/property-details/${booking.property_id}`}>
                        <button className="text-blue-900 font-semibold hover:text-blue-700 text-sm transition-colors">
                          View Property Details →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Cancel Booking</h3>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-900 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900">Refund Estimate</p>
                  <p className="text-blue-800 text-sm mt-1">
                    Based on our cancellation policy, you are eligible for a refund of:
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-2">₹{refundEstimate}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Cancellation <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                placeholder="e.g., Change of plans..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
