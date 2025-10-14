// components/BookingModal.js

import React, { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";

// Simple Dialog/modal fallback. You can enhance this with a headless modal or popular UI kit.
function SimpleModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-gray-900 text-xl">&times;</button>
        {children}
      </div>
    </div>
  );
}

export default function BookingModal({ property, user, onClose }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState("details");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = property.price_per_month * duration;

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      // Replace with API call or Next.js API
      return { id: "dummy-booking-id" }; // Mock
    },
    onSuccess: async (booking) => {
      setIsProcessing(true);
      // Simulate email sending / extra booking steps if needed
      setTimeout(() => {
        setIsProcessing(false);
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
      }, 1500);
    }
  });

  const handleBooking = () => {
    if (!startDate || !duration) {
      alert("Please fill in all fields");
      return;
    }
    setStep("payment");
  };

  const handlePayment = () => {
    setIsProcessing(true);
    createBookingMutation.mutate({
      property_id: property.id,
      property_title: property.title,
      renter_email: user.email,
      renter_name: user.full_name,
      landlord_email: property.landlord_email,
      start_date: startDate,
      duration_months: duration,
      total_amount: totalAmount,
      status: "pending",
      payment_status: "pending"
    });
  };

  return (
    <SimpleModal open={true} onClose={onClose}>
      <div>
        <h2 className="text-2xl font-bold mb-4">
          {step === "details" && "Book This Property"}
          {step === "payment" && "Payment Details"}
          {step === "success" && "Booking Confirmed!"}
        </h2>

        {step === "details" && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{property.title}</h3>
              <p className="text-sm text-gray-600">{property.location}</p>
              <p className="text-lg font-bold text-blue-900 mt-2">${property.price_per_month}/month</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="start-date" className="font-medium block mb-1">Move-in Date</label>
                <input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label htmlFor="duration" className="font-medium block mb-1">Rental Duration (months)</label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="24"
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Monthly Rent</span>
                  <span className="font-semibold">${property.price_per_month}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{duration} months</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-blue-900">${totalAmount}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleBooking}
              className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded"
              disabled={!startDate || !duration}
            >
              Continue to Payment
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold text-blue-900">${totalAmount}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="card-number" className="font-medium block mb-1">Card Number</label>
                <input id="card-number" placeholder="1234 5678 9012 3456" className="w-full border p-2 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="expiry" className="font-medium block mb-1">Expiry Date</label>
                  <input id="expiry" placeholder="MM/YY" className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label htmlFor="cvv" className="font-medium block mb-1">CVV</label>
                  <input id="cvv" placeholder="123" maxLength={3} className="w-full border p-2 rounded" />
                </div>
              </div>
              <div>
                <label htmlFor="name" className="font-medium block mb-1">Cardholder Name</label>
                <input id="name" placeholder="John Doe" className="w-full border p-2 rounded" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("details")}
                className="flex-1 border rounded py-3 bg-white"
                disabled={isProcessing}
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold rounded py-3"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2 inline" />
                    Pay ${totalAmount}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-6">
              Your booking has been confirmed. Check your email for details.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-blue-900 hover:bg-blue-800 py-3 rounded text-white font-semibold"
            >
              View My Bookings
            </button>
          </div>
        )}
      </div>
    </SimpleModal>
  );
}
