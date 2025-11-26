import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Phone, Shield, CheckCircle, History, DollarSign } from "lucide-react";
import { format } from "date-fns";

export default function Profile() {
    const { data: session, status, update } = useSession();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const router = useRouter();
    const queryClient = useQueryClient();

    // State
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState("");

    // Auth Redirect
    useEffect(() => {
        if (status === "unauthenticated") {
            signIn(undefined, { callbackUrl: "/profile" });
        }
    }, [status]);

    // Queries
    const { data: user, isLoading: isUserLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/user/profile");
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        enabled: status === "authenticated",
    });

    const { data: transactions = [] } = useQuery({
        queryKey: ["my-transactions"],
        queryFn: async () => {
            const res = await fetch("/api/user/bookings");
            if (!res.ok) throw new Error("Failed to fetch transactions");
            return res.json();
        },
        enabled: status === "authenticated",
    });

    // Mutations
    const handleUpdateProfile = async () => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "update_profile",
                    ...editData
                })
            });
            if (res.ok) {
                setIsEditing(false);
                queryClient.invalidateQueries(["profile"]);
                alert("Profile updated successfully!");
            } else {
                alert("Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            alert("Error updating profile");
        }
    };

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

    const updatePhoneMutation = useMutation({
        mutationFn: async (phone) => {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_phone", phone }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to update phone");
            }
            return res.json();
        },
        onSuccess: () => {
            setMessage("Phone number updated successfully!");
            setIsEditingPhone(false);
            queryClient.invalidateQueries(["profile"]);
            update(); // Update session
        },
        onError: (err) => {
            setError(err.message);
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/user/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete_account" }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Failed to delete account");
            }
            return res.json();
        },
        onSuccess: () => {
            // Sign out and redirect to home
            import("next-auth/react").then(({ signOut }) => {
                signOut({ callbackUrl: "/" });
            });
        },
        onError: (err) => {
            setError(err.message);
            setShowDeleteConfirm(false);
        },
    });

    // Handlers
    const handleUpdatePhone = () => {
        if (!newPhone || newPhone.length !== 10) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        updatePhoneMutation.mutate(newPhone);
    };

    const handleDeleteAccount = () => {
        if (deleteConfirmationText !== "DELETE") {
            setError("Please type DELETE to confirm.");
            return;
        }
        deleteAccountMutation.mutate();
    };

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

    if (status === "loading" || status === "unauthenticated" || isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
        );
    }

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
                            {!user?.phone && !isEditingPhone && (
                                <button
                                    onClick={() => { setIsEditingPhone(true); setNewPhone(""); }}
                                    className="ml-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Add Number
                                </button>
                            )}
                            {/* Edit button removed as per requirement: Phone number is immutable once set */}

                            {isEditingPhone && (
                                <div className="flex items-center gap-2 ml-4">
                                    <input
                                        type="tel"
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                        placeholder="10-digit number"
                                        className="border rounded px-2 py-1 text-sm w-32"
                                    />
                                    <button
                                        onClick={handleUpdatePhone}
                                        disabled={updatePhoneMutation.isPending}
                                        className="text-sm bg-blue-900 text-white px-2 py-1 rounded hover:bg-blue-800"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditingPhone(false)}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
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
                        {!user?.is_verified && (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-2">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            Please add a phone number to verify your account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Additional Details Section */}
                        <div className="border-t border-gray-100 pt-6 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Additional Details</h3>
                                {!isEditing ? (
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setEditData({
                                                city: user?.city || "",
                                                state: user?.state || "",
                                                country: user?.country || "",
                                                preferred_city: user?.preferred_city || "",
                                                budget_range: user?.budget_range || ""
                                            });
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Edit Details
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-sm text-gray-500 hover:text-gray-700"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="text-sm bg-blue-900 text-white px-3 py-1 rounded hover:bg-blue-800"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(user?.user_type === "landlord" || user?.user_type === "both") && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">City</label>
                                            {isEditing ? (
                                                <input
                                                    value={editData.city}
                                                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                                    className="mt-1 w-full border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{user?.city || "-"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">State</label>
                                            {isEditing ? (
                                                <input
                                                    value={editData.state}
                                                    onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                                                    className="mt-1 w-full border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{user?.state || "-"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Country</label>
                                            {isEditing ? (
                                                <input
                                                    value={editData.country}
                                                    onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                                                    className="mt-1 w-full border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{user?.country || "-"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Government ID</label>
                                            <p className="text-gray-900 font-mono">{user?.govt_id || "-"}</p>
                                            {isEditing && <p className="text-xs text-red-500 mt-1">Immutable for security</p>}
                                        </div>
                                    </>
                                )}

                                {(user?.user_type === "renter" || user?.user_type === "both") && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Preferred City</label>
                                            {isEditing ? (
                                                <input
                                                    value={editData.preferred_city}
                                                    onChange={(e) => setEditData({ ...editData, preferred_city: e.target.value })}
                                                    className="mt-1 w-full border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{user?.preferred_city || "-"}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500">Budget Range</label>
                                            {isEditing ? (
                                                <input
                                                    value={editData.budget_range}
                                                    onChange={(e) => setEditData({ ...editData, budget_range: e.target.value })}
                                                    className="mt-1 w-full border rounded px-2 py-1"
                                                />
                                            ) : (
                                                <p className="text-gray-900">{user?.budget_range || "-"}</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900 flex items-center">
                            <History className="w-5 h-5 mr-2 text-blue-900" />
                            Transaction History
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-900 font-semibold">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Property</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx) => (
                                        <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                {tx.payment_date ? format(new Date(tx.payment_date), "MMM d, yyyy") : "-"}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {tx.property_title}
                                            </td>
                                            <td className="px-6 py-4 text-blue-900 font-bold">
                                                ₹{tx.total_amount}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${tx.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {tx.payment_status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>


                {user?.user_type === "renter" && (
                    <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg p-8 text-white mb-8">
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

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-red-100">
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Deleting your account is irreversible. All your data will be permanently removed and active bookings will be cancelled.
                        </p>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>

                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmationText(""); setError(""); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>

                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Account?</h3>

                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                                <p className="text-red-800 text-sm font-medium">
                                    Warning: This action cannot be undone.
                                </p>
                                <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                                    <li>You will lose access immediately.</li>
                                    <li>All active bookings will be cancelled.</li>
                                    <li>Your profile will be permanently deactivated.</li>
                                </ul>
                            </div>

                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type <strong>DELETE</strong> to confirm
                                    </label>
                                    <input
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder="DELETE"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteAccountMutation.isPending || deleteConfirmationText !== "DELETE"}
                                    className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete Account"}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="w-full text-gray-500 text-sm hover:underline"
                                >
                                    Cancel
                                </button>
                            </div>
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
