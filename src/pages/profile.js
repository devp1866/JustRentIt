import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Phone, Shield, CheckCircle } from "lucide-react";

export default function Profile() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const { data: user, isLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/user/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        enabled: !!session,
    });

    const upgradeMutation = useMutation({
        mutationFn: async (data) => {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Action failed");
            }
            return res.json();
        },
        onSuccess: async (data) => {
            if (data.message === "OTP sent successfully") {
                setOtpSent(true);
                setMessage("OTP sent! Check your console (mock).");
                setError("");
            } else if (data.message === "Profile upgraded successfully") {
                setMessage("Profile upgraded! You can now list properties.");
                setShowUpgrade(false);
                setOtpSent(false);
                setOtp("");
                setOtp("");
                queryClient.invalidateQueries(["profile"]);
                // Force session update
                await update({ user_type: "both", phone: phoneInput });
                setTimeout(() => router.push("/add-property"), 1500);
            }
        },
        onError: (err) => {
            setError(err.message);
            setMessage("");
        },
    });

    const handleUpgradeClick = () => {
        setShowUpgrade(true);
        if (user?.phone) {
            setPhoneInput(user.phone);
        }
    };

    const handleSendOtp = () => {
        if (!phoneInput || phoneInput.length !== 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        upgradeMutation.mutate({ action: "send_otp", phone: phoneInput });
    };

    const handleVerifyOtp = () => {
        if (!otp) {
            setError("Please enter the OTP.");
            return;
        }
        upgradeMutation.mutate({ action: "verify_otp", otp, phone: phoneInput });
    };

    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (!session) return <div className="min-h-screen flex items-center justify-center">Please log in.</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="bg-blue-900 p-6 text-white flex items-center">
                        <div className="bg-white/20 p-3 rounded-full mr-4">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{user?.full_name}</h2>
                            <p className="text-blue-200">{user?.email}</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center text-gray-600">
                                <Shield className="w-5 h-5 mr-3 text-blue-900" />
                                <span className="font-medium">Account Type</span>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold capitalize">
                                {user?.user_type === "both" ? "Landlord & Renter" : user?.user_type}
                            </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div className="flex items-center text-gray-600">
                                <Phone className="w-5 h-5 mr-3 text-blue-900" />
                                <span className="font-medium">Phone Number</span>
                            </div>
                            <span className="text-gray-900">{user?.phone || "Not set"}</span>
                        </div>

                        <div className="flex items-center justify-between pb-2">
                            <div className="flex items-center text-gray-600">
                                <CheckCircle className="w-5 h-5 mr-3 text-blue-900" />
                                <span className="font-medium">Verification Status</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user?.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                {user?.is_verified ? "Verified" : "Unverified"}
                            </span>
                        </div>
                    </div>
                </div>

                {user?.user_type === "renter" && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div className="mb-6 md:mb-0">
                                <h3 className="text-2xl font-bold mb-2">Become a Landlord</h3>
                                <p className="text-amber-100 max-w-md">
                                    List your properties and reach thousands of potential tenants.
                                    Upgrade your account today - it&apos;s free!
                                </p>
                            </div>
                            <button
                                onClick={handleUpgradeClick}
                                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-bold hover:bg-amber-50 transition-colors shadow-md"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                )}

                {showUpgrade && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
                            <button
                                onClick={() => { setShowUpgrade(false); setOtpSent(false); setError(""); setMessage(""); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>

                            <h3 className="text-2xl font-bold text-gray-900 mb-6">Verify Phone Number</h3>

                            {message && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm">{message}</div>}
                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                            {!otpSent ? (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        To become a landlord, we need to verify your phone number.
                                        We will send a One-Time Password (OTP) to this number.
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phoneInput}
                                            onChange={(e) => setPhoneInput(e.target.value)}
                                            placeholder="Enter 10-digit number"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSendOtp}
                                        disabled={upgradeMutation.isLoading}
                                        className="w-full bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition-colors"
                                    >
                                        {upgradeMutation.isLoading ? "Sending..." : "Send OTP"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        Enter the OTP sent to <strong>{phoneInput}</strong>.
                                        <br />
                                        <span className="text-xs text-gray-500">(Check console for mock OTP: 123456)</span>
                                    </p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter OTP"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest font-mono text-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={upgradeMutation.isLoading}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-colors"
                                    >
                                        {upgradeMutation.isLoading ? "Verifying..." : "Verify & Upgrade"}
                                    </button>
                                    <button
                                        onClick={() => setOtpSent(false)}
                                        className="w-full text-gray-500 text-sm hover:underline"
                                    >
                                        Change Phone Number
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
