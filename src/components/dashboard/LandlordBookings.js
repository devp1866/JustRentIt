import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, AlertCircle, XCircle, CheckCircle, Building2 } from "lucide-react";
import Image from "next/image";

export default function LandlordBookings() {
    const queryClient = useQueryClient();
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [reason, setReason] = useState("");
    const [showModal, setShowModal] = useState(false);

    const { data: bookings = [], isLoading, error } = useQuery({
        queryKey: ["landlord-bookings"],
        queryFn: async () => {
            const res = await fetch("/api/landlord/bookings");
            if (!res.ok) throw new Error("Failed to fetch bookings");
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
            queryClient.invalidateQueries(["landlord-bookings"]);
            setShowModal(false);
            setReason("");
            setSelectedBooking(null);
            alert("Booking revoked successfully");
        },
        onError: (err) => {
            alert(err.message);
        },
    });

    const handleRevokeClick = (booking) => {
        setSelectedBooking(booking);
        setShowModal(true);
    };

    const handleConfirmRevoke = () => {
        if (!reason.trim()) {
            alert("Please provide a reason for revocation.");
            return;
        }
        cancelMutation.mutate({ bookingId: selectedBooking._id, reason });
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="text-red-500 p-4">Error loading bookings</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Received Bookings</h2>

            {bookings.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                    No bookings found for your properties.
                </div>
            ) : (
                <div className="grid gap-6">
                    {bookings.map((booking) => (
                        <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Property Image */}
                                <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                    {booking.property_image ? (
                                        <Image
                                            src={booking.property_image}
                                            alt={booking.property_title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-400">
                                            <Building2 className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{booking.property_title}</h3>
                                            <p className="text-sm text-gray-500">Booking ID: {booking._id.slice(-6).toUpperCase()}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-gray-500 mb-1">Renter Details</p>
                                            <p className="font-medium text-gray-900">{booking.renter_name || "N/A"}</p>
                                            <p className="text-gray-600">{booking.renter_email}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 mb-1">Booking Period</p>
                                            <p className="font-medium text-gray-900">
                                                {format(new Date(booking.start_date), "MMM d, yyyy")} - {booking.end_date ? format(new Date(booking.end_date), "MMM d, yyyy") : "N/A"}
                                            </p>
                                            <p className="text-gray-600">
                                                {booking.duration_months ? `${booking.duration_months} Months` : `${booking.duration_days} Days`}
                                            </p>
                                        </div>
                                    </div>

                                    {booking.status === "cancelled" && (
                                        <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-100 text-sm">
                                            <p className="font-semibold text-red-800 mb-1">Cancellation Details:</p>
                                            <p className="text-red-700"><span className="font-medium">Reason:</span> {booking.cancellation_reason}</p>
                                            <p className="text-red-700"><span className="font-medium">Cancelled By:</span> {booking.cancelled_by === "landlord" ? "You" : "Renter"}</p>
                                            <p className="text-red-700"><span className="font-medium">Refund Status:</span> {booking.refund_status} (₹{booking.refund_amount})</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col justify-center items-end min-w-[120px]">
                                    <p className="text-xl font-bold text-blue-900 mb-4">₹{booking.total_amount}</p>

                                    {booking.status === "confirmed" && (
                                        <button
                                            onClick={() => handleRevokeClick(booking)}
                                            className="w-full px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Revoke
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Revoke Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Revoke Booking</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Are you sure you want to revoke this booking? This action will cancel the booking and initiate a full refund to the renter.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Revocation <span className="text-red-500">*</span></label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-24 resize-none"
                                placeholder="e.g., Property maintenance required..."
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRevoke}
                                disabled={cancelMutation.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {cancelMutation.isPending ? "Revoking..." : "Confirm Revoke"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
