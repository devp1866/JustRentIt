import React, { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle, CreditCard } from "lucide-react";
import { format, addMonths, addDays } from "date-fns";
import { isSameDay, parseISO } from 'date-fns';
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// Simple Dialog/modal fallback. You can enhance this with a headless modal or popular UI kit.
function SimpleModal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border border-brand-blue/10">
        <button onClick={onClose} className="absolute top-4 right-4 text-brand-dark/40 hover:text-brand-dark transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export default function BookingModal({ property, user, onClose, selectedRoom, rentalType }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [step, setStep] = useState("details");
  const [startDate, setStartDate] = useState("");
  const isShortTerm = (rentalType || property.rental_type) === 'short_term';
  const [duration, setDuration] = useState(isShortTerm ? 3 : 6);
  const [isProcessing, setIsProcessing] = useState(false);

  // Price Logic: Use selectedRoom price if available, fallback to property base price
  const basePricePerMonth = selectedRoom ? selectedRoom.price_per_month : property.price_per_month;
  const basePricePerNight = selectedRoom ? selectedRoom.price_per_night : property.price_per_night;

  const price = isShortTerm
    ? (basePricePerNight || basePricePerMonth / 30)
    : basePricePerMonth;

  const baseTotal = Math.round(price * duration);

  // Fetch booked dates
  const { data: bookedData } = useQuery({
    queryKey: ['booked-dates', property._id, selectedRoom?._id],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (selectedRoom?._id) {
        queryParams.append('room_id', selectedRoom._id);
      }
      const res = await fetch(`/api/properties/${property._id}/booked-dates?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch booked dates');
      return res.json();
    },
    enabled: !!property._id,
  });

  const bookedRanges = bookedData?.bookings || [];

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
        queryClient.invalidateQueries({ queryKey: ["booked-dates", property._id] });
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

  const [termsAccepted, setTermsAccepted] = useState(new Array(11).fill(false));

  // Check if selected range overlaps with booked dates
  const isDateRangeAvailable = (start, duration) => {
    if (!start) return true;
    const startDateObj = new Date(start);
    let endDateObj;

    if (isShortTerm) {
      endDateObj = addDays(startDateObj, duration);
    } else {
      endDateObj = addMonths(startDateObj, duration);
    }

    // Check overlap with fetched booked ranges
    return !bookedRanges.some(booking => {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return (startDateObj < bookingEnd && endDateObj > bookingStart);
    });
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
    if (!termsAccepted.every(Boolean)) {
      alert("Please agree to all Terms & Conditions to proceed.");
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
            rental_type: rentalType || property.rental_type,
            total_amount: totalAmount,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            room_id: selectedRoom?._id // Include room_id if selected
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
          color: "#82C8E5", // brand-blue
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
        <h2 className="text-2xl font-bold mb-4 text-brand-dark">
          {step === "details" && "Book This Property"}
          {step === "payment" && "Payment Details"}
          {step === "success" && "Booking Confirmed!"}
        </h2>

        {step === "details" && (
          <div className="space-y-6">
            <div className="bg-brand-cream/30 rounded-xl p-4 border border-brand-blue/10">
              <h3 className="font-bold text-brand-dark mb-1">{property.title}</h3>
              {selectedRoom && (
                <p className="text-sm font-semibold text-brand-blue mb-1">Room: {selectedRoom.name}</p>
              )}
              <p className="text-sm text-brand-dark/70">{property.location}</p>
              <p className="text-lg font-bold text-brand-blue mt-2">
                ₹{isShortTerm ? (selectedRoom?.price_per_night || property.price_per_night) : (selectedRoom?.price_per_month || property.price_per_month)}/{isShortTerm ? "night" : "month"}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="font-bold block mb-1 text-brand-dark">Move-in Date</label>
                <div className="border border-brand-blue/20 rounded-xl p-2 flex justify-center bg-white">
                  <DayPicker
                    mode="single"
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => setStartDate(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={[
                      { before: new Date() },
                      ...bookedRanges.map(range => ({
                        from: new Date(range.start_date),
                        to: addDays(new Date(range.end_date), -1)
                      }))
                    ]}
                    modifiersStyles={{
                      disabled: { color: "gray", backgroundColor: "#f3f4f6", textDecoration: "line-through" }
                    }}
                    styles={{
                      caption: { color: '#1e293b' }
                    }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="duration" className="font-bold block mb-1 text-brand-dark">
                  {isShortTerm ? "Duration (Nights)" : "Rental Duration (months)"}
                </label>
                <input
                  id="duration"
                  type="number"
                  min={isShortTerm ? "1" : "1"}
                  max={isShortTerm ? "30" : "24"}
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full border border-brand-blue/20 p-3 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none bg-brand-cream/20"
                />
              </div>
              <div className="bg-brand-blue/5 rounded-xl p-4 border border-brand-blue/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-brand-dark/70">{isShortTerm ? "Nightly Rate" : "Monthly Rent"}</span>
                  <span className="font-bold text-brand-dark">₹{Math.round(price)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-brand-dark/70">Duration</span>
                  <span className="font-bold text-brand-dark">{duration} {isShortTerm ? "nights" : "months"}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-brand-blue/10">
                  <span className="font-bold text-brand-dark">Subtotal</span>
                  <span className="font-bold text-brand-dark">₹{baseTotal}</span>
                </div>
                {isOfferApplied && (
                  <div className="flex justify-between items-center text-brand-green">
                    <span>Discount ({property.offer.discount_percentage}% off)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-brand-blue/10 mt-2">
                  <span className="font-bold text-lg text-brand-dark">Total Amount</span>
                </div>
              </div>

              <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-brand-yellow/20 p-2 rounded-full text-brand-dark/70">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </div>
                <div>
                  <h4 className="font-bold text-brand-dark text-sm">Important Timing</h4>
                  <p className="text-xs text-brand-dark/70 mt-1">
                    Standard Check-in: <span className="font-bold">10:00 AM</span>
                    <br />
                    Standard Check-out: <span className="font-bold">10:00 AM</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tenant Terms Checklist */}
            <div className="bg-white rounded-xl p-4 border border-brand-blue/10">
              <h3 className="font-bold text-brand-dark mb-3">Terms & Conditions</h3>
              <div className="space-y-2">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="agree_all_terms"
                    checked={termsAccepted.every(i => i) && termsAccepted.length === 12}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setTermsAccepted(checked ? new Array(12).fill(true) : new Array(12).fill(false));
                    }}
                    className="mt-1 h-4 w-4 text-brand-blue rounded border-brand-blue/30 focus:ring-brand-blue"
                  />
                  <label htmlFor="agree_all_terms" className="ml-3 text-sm font-bold text-brand-dark">
                    I agree to all JustRentIt Tenant Terms & Conditions.
                  </label>
                </div>
                <hr className="my-2 border-brand-blue/10" />
                {[
                  "I confirm all details provided are accurate and authentic.",
                  "I agree to sign a legal rental agreement with the landlord.",
                  "I will pay rent and bills on time as mutually agreed.",
                  "I will not damage the property or cause disturbances.",
                  "I agree to provide valid ID proof and accurate information.",
                  "I understand check-in/check-out timings and related charges.",
                  "I agree that cancellations follow the host’s refund policy.",
                  "I will follow society rules and maintain respectful behavior.",
                  "I will not sublet, misuse, or engage in illegal activities.",
                  "I understand JustRentIt is only a connecting platform.",
                  "I agree that violations may lead to eviction or legal action."
                ].map((term, idx) => (
                  <div key={idx} className="flex items-start">
                    <input
                      type="checkbox"
                      id={`term_${idx}`}
                      checked={termsAccepted[idx] || false}
                      onChange={(e) => {
                        const newTerms = [...termsAccepted];
                        newTerms[idx] = e.target.checked;
                        setTermsAccepted(prev => {
                          const updated = [...prev];
                          updated[idx] = e.target.checked;
                          return updated;
                        });
                      }}
                      className="mt-1 h-4 w-4 text-brand-blue rounded border-brand-blue/30 focus:ring-brand-blue"
                    />
                    <label htmlFor={`term_${idx}`} className="ml-3 text-sm text-brand-dark/70">
                      {term}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleBooking}
              className="w-full h-12 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl shadow-lg shadow-brand-blue/20 transition-all hover:scale-105"
              disabled={!startDate || !duration}
            >
              Continue to Payment
            </button>
          </div>
        )}

        {
          step === "payment" && (
            <div className="space-y-6">
              <div className="bg-brand-cream/30 rounded-xl p-4 border border-brand-blue/10">
                <div className="flex justify-between items-center">
                  <span className="text-brand-dark/70">Total Amount</span>
                  <span className="text-2xl font-bold text-brand-blue">₹{totalAmount}</span>
                </div>
              </div>

              <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10">
                <p className="text-sm text-brand-blue mb-2 font-medium">
                  You are about to pay securely with Razorpay.
                </p>
                <p className="text-xs text-brand-blue/70">
                  Your booking details are saved. If you cancel the payment, you can try again without re-entering details.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("details")}
                  className="flex-1 border border-brand-blue/20 rounded-xl py-3 bg-white text-brand-dark/70 font-bold hover:bg-brand-cream transition-colors"
                  disabled={isProcessing}
                >
                  Back
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white font-bold rounded-xl py-3 shadow-lg shadow-brand-blue/20 transition-all hover:scale-105"
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
          )
        }

        {
          step === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-brand-green" />
              </div>
              <h3 className="text-xl font-bold text-brand-dark mb-2">Payment Successful!</h3>
              <p className="text-brand-dark/70 mb-6">
                Your booking has been confirmed. Check your email for details.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-brand-blue hover:bg-brand-blue/90 py-3 rounded-xl text-white font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-105"
              >
                View My Bookings
              </button>
            </div>
          )
        }
      </div>
    </SimpleModal>
  );
}
