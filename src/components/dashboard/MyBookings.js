import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar as CalendarIcon, MapPin, DollarSign, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { format, differenceInDays, parseISO, addDays, isWithinInterval, startOfDay } from "date-fns";
import Image from "next/image";
import ReviewModal from "../reviews/ReviewModal";
import DisputeModal from "../disputes/DisputeModal";

export default function MyBookings({ user }) {
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [refundEstimate, setRefundEstimate] = useState(0);
  const [reason, setReason] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayRent = async (escrow, month_number) => {
    setIsProcessingPayment(true);
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsProcessingPayment(false);
      return;
    }

    try {
      const orderRes = await fetch("/api/rent-payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrow_id: escrow._id, month_number }),
      });
      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.message || "Failed to create order");
      }
      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "JustRentIt Protect",
        description: `Rent for Month ${month_number}`,
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/rent-payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                escrow_id: escrow._id,
                month_number,
                base_rent: orderData.base_rent,
                guest_service_fee: orderData.guest_service_fee
              }),
            });
            if (!verifyRes.ok) throw new Error("Verification failed");

            alert(`Payment for Month ${month_number} successful!`);
            setShowPaymentModal(false);
            queryClient.invalidateQueries(["my-bookings"]);
          } catch (error) {
            console.error(error);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: "#2563EB" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.on("payment.failed", function (response) {
        alert(response.error.description);
      });
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const confirmMoveInMutation = useMutation({
    mutationFn: async ({ escrow_id }) => {
      const res = await fetch("/api/user/confirm-move-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ escrow_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm move-in");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-bookings"]);
      alert("Move-in confirmed successfully!");
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const confirmCheckinMutation = useMutation({
    mutationFn: async ({ booking_id }) => {
      const res = await fetch("/api/user/confirm-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to confirm check-in");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["my-bookings"]);
      alert("Check-in confirmed successfully!");
    },
    onError: (err) => {
      alert(err.message);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-brand-green animate-pulse';
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
                        <p className="text-xs text-brand-dark/50" title="Includes 8% Service Fee">Total Paid (Inc. Fee)</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Move-in</p>
                          <p className="text-sm text-brand-dark/70">{format(new Date(booking.start_date), "MMM d, yyyy")}, 10:00 AM</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Move-out</p>
                          <p className="text-sm text-brand-dark/70">
                            {booking.end_date ? `${format(new Date(booking.end_date), "MMM d, yyyy")}, 10:00 AM` : "N/A"}
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
                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-brand-blue mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-brand-dark">Fee Breakdown</p>
                          <p className="text-xs text-brand-dark/70">
                            Base: ₹{Math.round(booking.total_amount / 1.08)}<br />
                            Fee (8%): ₹{booking.guest_service_fee || Math.round(booking.total_amount - (booking.total_amount / 1.08))}
                          </p>
                          {booking.escrow_data && (
                            <span className="inline-block bg-brand-blue text-white text-[10px] px-2 py-0.5 rounded-full mt-1 font-bold">JustRentIt Protect Escrow</span>
                          )}
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

                      {/* Dispute Booking */}
                      {(booking.status === "active" || booking.status === "completed") && (
                        <button
                          onClick={() => {
                            setDisputeBooking(booking);
                            setShowDisputeModal(true);
                          }}
                          className="text-red-600 font-bold hover:text-red-800 text-sm transition-colors border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                        >
                          Report Issue
                        </button>
                      )}

                      {/* View Payment Schedule */}
                      {booking.escrow_data && booking.escrow_data.payment_schedule?.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedEscrow(booking.escrow_data);
                            setShowPaymentModal(true);
                          }}
                          className="bg-brand-dark font-bold text-white hover:bg-brand-dark/90 text-sm transition-colors px-3 py-1 rounded-lg shadow-md"
                        >
                          Payment Schedule
                        </button>
                      )}

                      {/* Confirm Move In for Escrow (Long Term) */}
                      {booking.escrow_data && (booking.status === "active" || booking.status === "confirmed") && !booking.escrow_data.move_in_confirmed && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to confirm move-in? This releases the first month's rent to the landlord.")) {
                              confirmMoveInMutation.mutate({ escrow_id: booking.escrow_data._id });
                            }
                          }}
                          disabled={confirmMoveInMutation.isPending}
                          className="bg-brand-blue font-bold text-white hover:bg-brand-blue/90 text-sm transition-colors px-3 py-1 rounded-lg shadow-md"
                        >
                          Confirm Move-In
                        </button>
                      )}

                      {/* Confirm Check In for Short Term */}
                      {!booking.escrow_data && (booking.status === "active" || booking.status === "confirmed") && !booking.check_in_confirmed && (
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to confirm check-in? This releases your payment to the landlord.")) {
                              confirmCheckinMutation.mutate({ booking_id: booking._id });
                            }
                          }}
                          disabled={confirmCheckinMutation.isPending}
                          className="bg-brand-blue font-bold text-white hover:bg-brand-blue/90 text-sm transition-colors px-3 py-1 rounded-lg shadow-md"
                        >
                          Confirm Check-In
                        </button>
                      )}

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

      {/* Dispute Modal */}
      {showDisputeModal && disputeBooking && (
        <DisputeModal
          booking={disputeBooking}
          userRole="renter"
          onClose={(success) => {
            setShowDisputeModal(false);
            if (success) {
              setDisputeBooking(null);
            }
          }}
        />
      )}

      {/* Payment Schedule Modal */}
      {showPaymentModal && selectedEscrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 border border-brand-blue/10 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-brand-dark">Payment Schedule</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 flex justify-between items-center">
                <div>
                  <p className="font-bold text-brand-dark">Initial Escrow (Month 1 & Deposit)</p>
                  <p className="text-sm text-brand-dark/70">Paid upfront</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-brand-blue">₹{selectedEscrow.first_month_rent + selectedEscrow.deposit_amount}</p>
                  <span className="inline-block bg-brand-green/20 text-brand-green text-xs px-2 py-0.5 rounded-full font-bold mt-1">Paid</span>
                </div>
              </div>

              {selectedEscrow.payment_schedule.map((payment) => (
                <div key={payment.month_number} className="bg-white border p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-bold text-brand-dark">Month {payment.month_number}</p>
                    <p className="text-sm text-brand-dark/70">Due: {format(new Date(payment.due_date), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-bold text-brand-blue">₹{payment.amount}</p>
                      {payment.status === 'paid' || payment.status === 'pending_payout_to_landlord' ? (
                        <span className="inline-block bg-brand-green/20 text-brand-green text-xs px-2 py-0.5 rounded-full font-bold mt-1">Paid</span>
                      ) : (
                        <span className="inline-block bg-brand-yellow/20 text-brand-yellow text-xs px-2 py-0.5 rounded-full font-bold mt-1">Pending</span>
                      )}
                    </div>
                    {payment.status === 'pending' && (
                      <button
                        onClick={() => handlePayRent(selectedEscrow, payment.month_number)}
                        disabled={isProcessingPayment}
                        className="bg-brand-blue text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-blue/90 disabled:opacity-50 shadow-md"
                      >
                        {isProcessingPayment ? "..." : "Pay Rent"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
