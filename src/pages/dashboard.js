import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Calendar as CalendarIcon, Building2 } from "lucide-react";
import MyProperties from "../components/dashboard/MyProperties";
import MyBookings from "../components/dashboard/MyBookings";
import LandlordBookings from "../components/dashboard/LandlordBookings";
import { useSession, signIn } from "next-auth/react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('bookings');

  const user = useMemo(() => {
    const u = session && {
      email: session.user.email,
      user_type: session.user.user_type || "renter",
    };
    console.log("[Dashboard] User:", u);
    return u;
  }, [session]);

  const userType = user?.user_type;

  useEffect(() => {
    if (userType === "landlord" || userType === "both") {
      setActiveTab("received_bookings");
    } else if (user) {
      setActiveTab("bookings");
    }
  }, [user, userType]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col">
        <p className="mb-4 text-lg">You must be signed in to access the dashboard.</p>
        <button
          className="px-6 py-2 bg-blue-900 text-white rounded"
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Dashboard</h1>
          <p className="text-gray-600">Manage your properties and bookings</p>
        </div>

        {/* Tabs Switcher */}
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
          {(user.user_type === "landlord" || user.user_type === "both") && (
            <>
              <button
                className={`flex items-center gap-2 px-4 py-2 border rounded whitespace-nowrap ${activeTab === "received_bookings" ? "bg-blue-900 text-white" : "bg-white"
                  }`}
                onClick={() => setActiveTab("received_bookings")}
              >
                <CalendarIcon className="w-4 h-4" />
                Received Bookings
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 border rounded whitespace-nowrap ${activeTab === "properties" ? "bg-blue-900 text-white" : "bg-white"
                  }`}
                onClick={() => setActiveTab("properties")}
              >
                <Building2 className="w-4 h-4" />
                My Properties
              </button>
            </>
          )}

          {(user.user_type === "renter" || user.user_type === "both") && (
            <button
              className={`flex items-center gap-2 px-4 py-2 border rounded whitespace-nowrap ${activeTab === "bookings" ? "bg-blue-900 text-white" : "bg-white"
                }`}
              onClick={() => setActiveTab("bookings")}
            >
              <CalendarIcon className="w-4 h-4" />
              My Bookings
            </button>
          )}
        </div>

        {/* Tab Contents */}
        {(user.user_type === "landlord" || user.user_type === "both") && activeTab === "received_bookings" && (
          <LandlordBookings />
        )}
        {(user.user_type === "landlord" || user.user_type === "both") && activeTab === "properties" && (
          <MyProperties user={user} />
        )}
        {(user.user_type === "renter" || user.user_type === "both") && activeTab === "bookings" && (
          <MyBookings user={user} />
        )}
      </div>
    </div>
  );
}
