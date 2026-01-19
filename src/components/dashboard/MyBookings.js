import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, MapPin, DollarSign, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, parseISO, addDays, isWithinInterval, startOfDay } from "date-fns";
import Image from "next/image";
import ReviewModal from "../reviews/ReviewModal";

export default function MyBookings({ user }) {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
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
      case 'active':
        return 'bg-brand-green animate-pulse'; // Distinction for active living
      case 'confirmed':
        return 'bg-brand-blue';
      case 'pending':
        return 'bg-yellow-600';
      case 'completed':
        return 'bg-gray-600';
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
      amount = booking.total_amount * 0.7;
    } else if (daysUntilCheckIn >= 3) {
      amount = booking.total_amount * 0.5;
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
        <h2 className="text-2xl font-bold text-brand-dark">
          My Bookings ({filteredBookings.length})
        </h2>
        <input
          type="month"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-brand-blue/20 rounded-xl px-4 py-2 text-sm bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue/50 outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-brand-blue/10">
              <div className="h-6 w-3/4 mb-4 bg-brand-cream/50 animate-pulse rounded" />
              <div className="h-4 w-1/2 mb-2 bg-brand-cream/50 animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-brand-cream/50 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-brand-blue/10">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-brand-dark/20" />
          <h3 className="text-xl font-bold text-brand-dark mb-2">No bookings found</h3>
          <p className="text-brand-dark/60 mb-6">
            {filterDate ? "Try changing the date filter" : "Browse properties and make your first booking"}
          </p>
          {!filterDate && (
            <Link href="/properties">
              <button className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl px-6 py-3 font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-105">
                Browse Properties
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-brand-blue/10 group">
              <div className="flex flex-col md:flex-row">
                {/* Property Image */}
                <div className="md:w-48 h-48 md:h-auto relative overflow-hidden">
                  <div className="w-full h-full relative">
                    <Image
                      src={booking.property_image || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"}
                      alt={booking.property_title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute top-2 left-2 z-10">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white shadow-sm ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-brand-dark">{booking.property_title}</h3>
                        {booking.room_name && (
                          <p className="text-sm font-semibold text-brand-blue/80 mt-0.5">Room: {booking.room_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-brand-blue">₹{booking.total_amount}</p>
                        <p className="text-xs text-brand-dark/50">Total Paid</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Move-in</p>
                          <p className="text-sm text-brand-dark/70">{format(new Date(booking.start_date), "MMM d, yyyy")}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Move-out</p>
                          <p className="text-sm text-brand-dark/70">
                            {booking.end_date ? format(new Date(booking.end_date), "MMM d, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Rate</p>
                          <p className="text-sm text-brand-dark/70">
                            {booking.duration_days
                              ? `${booking.duration_days} Nights`
                              : `${booking.duration_months} Months`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Landlord</p>
                          <p className="text-sm text-brand-dark/70">{booking.landlord_email}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 col-span-1 sm:col-span-2 bg-brand-yellow/10 p-2 rounded-lg border border-brand-yellow/20">
                        <div className="bg-brand-yellow/20 p-1 rounded-full text-brand-dark/70 mt-0.5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-brand-dark">Standard Timings</p>
                          <div className="flex justify-between items-center text-xs text-brand-dark/70 mt-0.5">
                            <span>Check-in: <span className="font-bold">10:00 AM</span></span>
                            <span>Check-out: <span className="font-bold">10:00 AM</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {booking.status === "cancelled" && (
                    <div className="mt-4 bg-red-50 p-3 rounded-xl border border-red-100 text-sm">
                      <p className="font-bold text-red-800 mb-1">Cancellation Details:</p>
                      <p className="text-red-700"><span className="font-medium">Reason:</span> {booking.cancellation_reason}</p>
                      <p className="text-red-700"><span className="font-medium">Refund Status:</span> {booking.refund_status} (₹{booking.refund_amount})</p>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between border-t border-brand-blue/10 pt-4">
                    <div className="flex items-center gap-2">
                      {booking.payment_status === 'paid' ? (
                        <span className="flex items-center text-brand-green text-sm font-bold">
                          <span className="w-2 h-2 bg-brand-green rounded-full mr-2"></span>
                          Payment Successful
                        </span>
                      ) : (
                        <span className="flex items-center text-brand-yellow text-sm font-bold">
                          <span className="w-2 h-2 bg-brand-yellow rounded-full mr-2"></span>
                          Payment Pending
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {booking.status === "confirmed" && (
                        <button
                          onClick={() => handleCancelClick(booking)}
                          className="text-red-600 font-bold hover:text-red-800 text-sm transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                      <Link href={`/property-details/${booking.property_id}`}>
                        <button className="text-brand-blue font-bold hover:text-brand-blue/80 text-sm transition-colors">
                          View Property Details →
                        </button>
                      </Link>
                      {/* Review Logic */}
                      {/* Review Logic */}
                      {(booking.status === 'active' || booking.status === 'completed') && (() => {
                        const now = new Date();
                        const moveIn = parseISO(booking.start_date);
                        const moveOut = booking.end_date ? parseISO(booking.end_date) : moveIn;
                        const deadline = addDays(moveOut, 3);
                        const isWithinDeadline = isWithinInterval(now, { start: startOfDay(moveIn), end: deadline });

                        // Notification for last day (if review not submitted)
                        const isLastDay = !booking.has_review && differenceInDays(deadline, now) <= 1 && differenceInDays(deadline, now) >= 0;

                        if (booking.has_review) {
                          // Check for 12 hours edit window
                          const reviewTime = parseISO(booking.review_createdAt);
                          const hoursSinceReview = (now - reviewTime) / (1000 * 60 * 60);

                          if (hoursSinceReview <= 12) {
                            return (
                              <button
                                onClick={() => {
                                  setReviewBooking(booking);
                                  setShowReviewModal(true);
                                }}
                                className="ml-3 px-4 py-2 border border-brand-dark/20 text-brand-dark text-sm font-bold rounded-lg hover:bg-brand-cream transition-colors"
                              >
                                Edit Review
                              </button>
                            );
                          } else {
                            return (
                              <span className="ml-3 px-4 py-2 text-brand-green text-sm font-bold flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Review Submitted
                              </span>
                            );
                          }
                        }

                        if (isWithinDeadline) {
                          return (
                            <div className="flex items-center gap-2">
                              {isLastDay && (
                                <div className="flex items-center gap-1 text-xs font-bold text-red-500 animate-pulse bg-red-50 px-2 py-1 rounded-lg border border-red-100">
                                  <AlertCircle className="w-3 h-3" />
                                  Review closes today!
                                </div>
                              )}
                              <button
                                onClick={() => {
                                  setReviewBooking(booking);
                                  setShowReviewModal(true);
                                }}
                                className="ml-3 px-4 py-2 bg-brand-dark text-white text-sm font-bold rounded-lg hover:bg-brand-blue transition-colors shadow-md"
                              >
                                Write Review
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
      }

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-brand-blue/10">
            <h3 className="text-xl font-bold text-brand-dark mb-4">Cancel Booking</h3>

            <div className="bg-brand-blue/5 p-4 rounded-xl mb-6 border border-brand-blue/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-brand-blue mt-0.5" />
                <div>
                  <p className="font-bold text-brand-blue">Refund Estimate</p>
                  <p className="text-brand-blue/80 text-sm mt-1">
                    Based on our cancellation policy, you are eligible for a refund of:
                  </p>
                  <p className="text-2xl font-bold text-brand-blue mt-2">₹{refundEstimate}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-brand-dark mb-2">Reason for Cancellation <span className="text-red-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none h-24 resize-none bg-brand-cream/20"
                placeholder="e.g., Change of plans..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-3 border border-brand-blue/20 text-brand-dark/70 rounded-xl font-bold hover:bg-brand-cream transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-600/20"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          initialData={reviewBooking?.review_data}
          onClose={(success) => {
            setShowReviewModal(false);
            if (success) setReviewBooking(null);
          }}
        />
      )}
    </div>
  );
}
