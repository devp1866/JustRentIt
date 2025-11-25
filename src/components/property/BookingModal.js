import React, { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { isSameDay, parseISO } from 'date-fns';

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

export default function BookingModal({ property, user, onClose, bookedDates = [] }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState("details");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(property.rental_type === 'short_term' ? 3 : 6);
  const [isProcessing, setIsProcessing] = useState(false);

  const isShortTerm = property.rental_type === 'short_term';
  const price = isShortTerm ? (property.price_per_night || property.price_per_month / 30) : property.price_per_month;
  const baseTotal = Math.round(price * duration);

  let discountAmount = 0;
  let isOfferApplied = false;

  if (property.offer && property.offer.enabled) {
    if (duration >= property.offer.required_duration) {
      discountAmount = Math.round(baseTotal * (property.offer.discount_percentage / 100));
      isOfferApplied = true;
    }
  }

  const totalAmount = baseTotal - discountAmount;

  const createBookingMutation = useMutation({
    mutationFn: async (bookingData) => {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Booking failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      setIsProcessing(true);
      // Simulate email sending / extra booking steps if needed
      setTimeout(() => {
        setIsProcessing(false);
        setStep("success");
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
      }, 1500);
    },
    onError: (error) => {
      setIsProcessing(false);
      alert(error.message);
    }
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Check if selected range overlaps with booked dates
  const isDateRangeAvailable = (start, duration) => {
    if (!start) return true;
    const startDateObj = new Date(start);
    const endDateObj = new Date(startDateObj);

    if (isShortTerm) {
      endDateObj.setDate(endDateObj.getDate() + duration);
    } else {
      endDateObj.setMonth(endDateObj.getMonth() + duration);
    }

    return !bookedDates.some(bookedDate =>
      bookedDate >= startDateObj && bookedDate < endDateObj
    );
  };

  const handleBooking = () => {
    if (!startDate || !duration) {
      alert("Please fill in all fields");
      return;
    }
    if (!isDateRangeAvailable(startDate, duration)) {
      alert("Selected dates overlap with an existing booking. Please choose different dates.");
      return;
    }
    setStep("payment");
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setIsProcessing(false);
      return;
    }

    // Create Order
    try {
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR", // Assuming INR for Razorpay
        }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order");
      }

      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // You'll need to expose this env var
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Just Rent It",
        description: `Booking for ${property.title}`,
        // image: "/logo.png", // Removed to prevent CORS error on localhost
        order_id: orderData.id,
        handler: async function (response) {
          // Payment Success
          createBookingMutation.mutate({
            property_id: property._id,
            property_title: property.title,
            renter_email: user.email,
            renter_name: user.full_name,
            landlord_email: property.landlord_email,
            start_date: startDate,
            duration_months: isShortTerm ? 0 : duration,
            duration_days: isShortTerm ? duration : 0,
            rental_type: property.rental_type,
            total_amount: totalAmount,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
        },
        prefill: {
          name: user.full_name,
          email: user.email,
          contact: user.phone || "",
        },
        notes: {
          address: "Razorpay Corporate Office",
        },
        theme: {
          color: "#1e3a8a", // blue-900
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            console.log("Checkout form closed");
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert("Payment initiation failed");
      setIsProcessing(false);
    }
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
              <p className="text-lg font-bold text-blue-900 mt-2">₹{property.price_per_month}/month</p>
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
                <label htmlFor="duration" className="font-medium block mb-1">
                  {isShortTerm ? "Duration (Nights)" : "Rental Duration (months)"}
                </label>
                <input
                  id="duration"
                  type="number"
                  min={isShortTerm ? "1" : "1"}
                  max={isShortTerm ? "30" : "24"}
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">{isShortTerm ? "Nightly Rate" : "Monthly Rent"}</span>
                  <span className="font-semibold">₹{Math.round(price)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-semibold">{duration} {isShortTerm ? "nights" : "months"}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                  <span className="font-semibold text-gray-900">Subtotal</span>
                  <span className="font-semibold text-gray-900">₹{baseTotal}</span>
                </div>
                {isOfferApplied && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Discount ({property.offer.discount_percentage}% off)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-blue-200 mt-2">
                  <span className="font-bold text-lg text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-blue-900">₹{totalAmount}</span>
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
                <span className="text-2xl font-bold text-blue-900">₹{totalAmount}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 mb-2">
                You are about to pay securely with Razorpay.
              </p>
              <p className="text-xs text-blue-600">
                Your booking details are saved. If you cancel the payment, you can try again without re-entering details.
              </p>
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
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded py-3"
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
                    Pay Now
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
