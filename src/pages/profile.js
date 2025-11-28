import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    User, Phone, Shield, CheckCircle, History, DollarSign,
    IdCard, Lock, MapPin, AlertTriangle, Menu, X, ChevronRight, Mail
} from "lucide-react";
import { format } from "date-fns";
import Image from "next/image";

export default function Profile() {
    const { data: session, status, update } = useSession();
    const [activeTab, setActiveTab] = useState("basic");

    // Editing States
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState("");

    // Action States
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Form/Feedback States
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const router = useRouter();
    const queryClient = useQueryClient();

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
            update();
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

    // Initialize edit data when entering edit mode
    const startEditing = () => {
        setIsEditing(true);
        setEditData({
            city: user?.city || "",
            state: user?.state || "",
            country: user?.country || "",
            preferred_city: user?.preferred_city || "",
            budget_range: user?.budget_range || ""
        });
    };

    if (status === "loading" || status === "unauthenticated" || isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    // Navigation Items
    const navItems = [
        { id: "basic", label: "Basic Details", icon: User },
        { id: "additional", label: "Additional Details", icon: MapPin },
        { id: "govt_id", label: "Govt. ID's", icon: IdCard },
        { id: "preferences", label: "City & Budget", icon: DollarSign, hidden: user?.user_type === "landlord" },
        { id: "security", label: "Security", icon: Lock },
        { id: "transactions", label: "Transaction History", icon: History },
        { id: "danger", label: "Danger Zone", icon: AlertTriangle, className: "text-red-600 hover:bg-red-50" },
    ].filter(item => !item.hidden);

    // Render Functions
    const renderBasicDetails = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center text-brand-dark/80">
                    <Shield className="w-5 h-5 mr-3 text-brand-blue" />
                    <span className="font-medium">Account Type</span>
                </div>
                <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-semibold capitalize">
                    {user?.user_type === "both" ? "Landlord & Renter" : user?.user_type}
                </span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center text-brand-dark/80">
                    <Mail className="w-5 h-5 mr-3 text-brand-blue" />
                    <span className="font-medium">Email Address</span>
                </div>
                <span className="text-brand-dark font-medium">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center text-brand-dark/80">
                    <Phone className="w-5 h-5 mr-3 text-brand-blue" />
                    <span className="font-medium">Phone Number</span>
                </div>
                <div className="flex items-center">
                    {!isEditingPhone ? (
                        <>
                            <span className="text-brand-dark mr-4">{user?.phone || "Not set"}</span>
                            {!user?.phone && (
                                <button
                                    onClick={() => { setIsEditingPhone(true); setNewPhone(""); }}
                                    className="text-sm text-brand-blue hover:text-brand-blue/80 font-medium"
                                >
                                    Add
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                type="tel"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="10-digit number"
                                className="border border-brand-blue/20 rounded px-2 py-1 text-sm w-32 focus:ring-2 focus:ring-brand-blue/50 outline-none"
                            />
                            <button
                                onClick={handleUpdatePhone}
                                disabled={updatePhoneMutation.isPending}
                                className="text-sm bg-brand-blue text-white px-2 py-1 rounded hover:bg-brand-blue/90"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditingPhone(false)}
                                className="text-sm text-brand-dark/50 hover:text-brand-dark"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pb-2">
                <div className="flex items-center text-brand-dark/80">
                    <CheckCircle className="w-5 h-5 mr-3 text-brand-blue" />
                    <span className="font-medium">Verification Status</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${user?.is_verified ? "bg-brand-green/10 text-brand-green" : "bg-brand-yellow/10 text-brand-yellow"}`}>
                    {user?.is_verified ? "Verified" : "Unverified"}
                </span>
            </div>

            {!user?.is_verified && (
                <div className="bg-brand-yellow/5 border-l-4 border-brand-yellow p-4 mt-2">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-brand-dark/80">
                                Please add a phone number to verify your account.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {user?.user_type === "renter" && (
                <div className="mt-8 bg-gradient-to-r from-brand-yellow to-orange-500 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h3 className="text-xl font-bold mb-1">Become a Landlord</h3>
                            <p className="text-white/90 text-sm">
                                List properties and reach thousands of tenants.
                            </p>
                        </div>
                        <button
                            onClick={handleUpgradeClick}
                            className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold hover:bg-white/90 transition-colors shadow-md text-sm whitespace-nowrap"
                        >
                            Upgrade Now
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderAdditionalDetails = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-brand-dark">Location Details</h3>
                {!isEditing ? (
                    <button onClick={startEditing} className="text-sm text-brand-blue hover:text-brand-blue/80 font-medium">Edit</button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="text-sm text-brand-dark/50">Cancel</button>
                        <button onClick={handleUpdateProfile} className="text-sm bg-brand-blue text-white px-3 py-1 rounded hover:bg-brand-blue/90">Save</button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-brand-dark/60 mb-1">City</label>
                    {isEditing ? (
                        <input
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            className="w-full border border-brand-blue/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                        />
                    ) : <p className="text-brand-dark font-medium">{user?.city || "-"}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark/60 mb-1">State</label>
                    {isEditing ? (
                        <input
                            value={editData.state}
                            onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                            className="w-full border border-brand-blue/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                        />
                    ) : <p className="text-brand-dark font-medium">{user?.state || "-"}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark/60 mb-1">Country</label>
                    {isEditing ? (
                        <input
                            value={editData.country}
                            onChange={(e) => setEditData({ ...editData, country: e.target.value })}
                            className="w-full border border-brand-blue/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                        />
                    ) : <p className="text-brand-dark font-medium">{user?.country || "-"}</p>}
                </div>
            </div>
        </div>
    );

    const renderGovtIds = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-brand-cream/50 rounded-xl border border-brand-blue/10 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue">
                            <IdCard className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-brand-dark">Government ID Verification</h4>
                            <p className="text-sm text-brand-dark/60">Official Identity Document</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-brand-green/10 text-brand-green text-xs font-bold rounded-full uppercase tracking-wide">
                        Verified
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-brand-dark/50 uppercase tracking-wider mb-2">ID Number</label>
                        <p className="text-brand-dark font-mono text-lg tracking-wide bg-white border border-brand-blue/10 rounded-lg px-4 py-3">
                            {user?.govt_id || "Not provided"}
                        </p>
                    </div>

                    {user?.govt_id_image && (
                        <div>
                            <label className="block text-xs font-semibold text-brand-dark/50 uppercase tracking-wider mb-2">Document Preview</label>
                            <div className="relative h-48 w-full md:w-96 rounded-lg overflow-hidden border border-brand-blue/10 shadow-sm group">
                                <Image
                                    src={user.govt_id_image}
                                    alt="Government ID"
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex items-center text-xs text-brand-yellow bg-brand-yellow/10 p-3 rounded-lg border border-brand-yellow/20">
                    <Shield className="w-4 h-4 mr-2" />
                    This document is locked for security reasons. Contact support to update.
                </div>
            </div>
        </div>
    );

    const renderPreferences = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-brand-dark">Renter Preferences</h3>
                {!isEditing ? (
                    <button onClick={startEditing} className="text-sm text-brand-blue hover:text-brand-blue/80 font-medium">Edit</button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} className="text-sm text-brand-dark/50">Cancel</button>
                        <button onClick={handleUpdateProfile} className="text-sm bg-brand-blue text-white px-3 py-1 rounded hover:bg-brand-blue/90">Save</button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-brand-dark/60 mb-1">Preferred City</label>
                    {isEditing ? (
                        <input
                            value={editData.preferred_city}
                            onChange={(e) => setEditData({ ...editData, preferred_city: e.target.value })}
                            className="w-full border border-brand-blue/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                        />
                    ) : <p className="text-brand-dark font-medium">{user?.preferred_city || "-"}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-dark/60 mb-1">Budget Range</label>
                    {isEditing ? (
                        <input
                            value={editData.budget_range}
                            onChange={(e) => setEditData({ ...editData, budget_range: e.target.value })}
                            className="w-full border border-brand-blue/20 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                        />
                    ) : <p className="text-brand-dark font-medium">{user?.budget_range || "-"}</p>}
                </div>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-brand-dark">Password & Security</h3>
            </div>

            <div className="bg-white border border-brand-blue/10 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="font-medium text-brand-dark">Change Password</h4>
                        <p className="text-sm text-brand-dark/60">Update your password to keep your account secure.</p>
                    </div>
                    <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="text-sm text-brand-blue font-medium hover:underline"
                    >
                        {showChangePassword ? "Cancel" : "Update"}
                    </button>
                </div>

                {showChangePassword && (
                    <div className="mt-4 pt-4 border-t border-brand-blue/10 space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={editData.oldPassword || ""}
                                onChange={(e) => setEditData({ ...editData, oldPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-brand-blue/20 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-dark/80 mb-1">New Password</label>
                            <input
                                type="password"
                                value={editData.newPassword || ""}
                                onChange={(e) => setEditData({ ...editData, newPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-brand-blue/20 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                            />
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await fetch("/api/user/profile", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                            action: "change_password",
                                            oldPassword: editData.oldPassword,
                                            newPassword: editData.newPassword
                                        })
                                    });
                                    const data = await res.json();
                                    if (!res.ok) throw new Error(data.error);
                                    alert("Password changed successfully");
                                    setEditData({ ...editData, oldPassword: "", newPassword: "" });
                                    setShowChangePassword(false);
                                } catch (err) {
                                    alert(err.message);
                                }
                            }}
                            className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-blue/90 transition-colors"
                        >
                            Update Password
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderTransactions = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-brand-dark">Transaction History</h3>
            <div className="bg-white rounded-xl border border-brand-blue/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-brand-dark/70">
                        <thead className="bg-brand-blue/5 text-brand-dark font-semibold">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-blue/5">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-brand-dark/50">
                                        No transactions found.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx._id} className="hover:bg-brand-blue/5 transition-colors">
                                        <td className="px-6 py-4">
                                            {tx.payment_date ? format(new Date(tx.payment_date), "MMM d, yyyy") : "-"}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-brand-dark">
                                            {tx.property_title}
                                        </td>
                                        <td className="px-6 py-4 text-brand-blue font-bold">
                                            ₹{tx.total_amount}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${tx.payment_status === 'paid' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
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
        </div>
    );

    const renderDangerZone = () => (
        <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-bold text-red-600">Danger Zone</h3>
            <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                <h4 className="font-bold text-red-900 mb-2">Delete Account</h4>
                <p className="text-red-700 mb-4 text-sm">
                    Deleting your account is irreversible. All your data will be permanently removed and active bookings will be cancelled.
                </p>
                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors text-sm shadow-sm"
                >
                    Delete Account
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-brand-cream font-sans">
            {/* Mobile Navigation (Horizontal Scroll) */}
            <div className="md:hidden sticky top-16 z-40 bg-white border-b border-brand-blue/10 shadow-sm overflow-x-auto scrollbar-hide">
                <div className="flex p-2 gap-2 min-w-max">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${activeTab === item.id
                                    ? "bg-brand-blue text-white shadow-md"
                                    : "bg-brand-cream text-brand-dark/70 hover:bg-brand-blue/5"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation (Desktop) */}
                    <div className="hidden md:block md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-blue/10 overflow-hidden sticky top-24">
                            <div className="p-6 bg-brand-blue text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-white/20 p-2 rounded-full">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <h2 className="font-bold truncate">{user?.full_name}</h2>
                                        <p className="text-xs text-white/80 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <nav className="p-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1 ${activeTab === item.id
                                                ? "bg-brand-blue/5 text-brand-blue"
                                                : "text-brand-dark/70 hover:bg-brand-blue/5"
                                                } ${item.className || ""}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-5 h-5 ${activeTab === item.id ? "text-brand-blue" : "text-brand-dark/40"}`} />
                                                {item.label}
                                            </div>
                                            {activeTab === item.id && <ChevronRight className="w-4 h-4 text-brand-blue" />}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-brand-blue/10 p-6 md:p-8 min-h-[500px]">
                            {activeTab === "basic" && renderBasicDetails()}
                            {activeTab === "additional" && renderAdditionalDetails()}
                            {activeTab === "govt_id" && renderGovtIds()}
                            {activeTab === "preferences" && renderPreferences()}
                            {activeTab === "security" && renderSecurity()}
                            {activeTab === "transactions" && renderTransactions()}
                            {activeTab === "danger" && renderDangerZone()}
                        </div>
                    </div >
                </div >
            </div >

            {/* Modals (Delete Confirm & Upgrade) */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative animate-in zoom-in duration-200 border border-brand-blue/10">
                            <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmationText(""); setError(""); }}
                                className="absolute top-4 right-4 text-brand-dark/40 hover:text-brand-dark/60"
                            >
                                ✕
                            </button>
                            <h3 className="text-2xl font-bold text-brand-dark mb-4">Delete Account?</h3>
                            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
                                <p className="text-red-800 text-sm font-medium">Warning: This action cannot be undone.</p>
                                <ul className="list-disc list-inside text-red-700 text-sm mt-2 space-y-1">
                                    <li>You will lose access immediately.</li>
                                    <li>All active bookings will be cancelled.</li>
                                    <li>Your profile will be permanently deactivated.</li>
                                </ul>
                            </div>
                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-brand-dark/70 mb-1">Type <strong>DELETE</strong> to confirm</label>
                                    <input
                                        type="text"
                                        value={deleteConfirmationText}
                                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                                        placeholder="DELETE"
                                        className="w-full px-4 py-2 border border-brand-blue/20 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteAccountMutation.isPending || deleteConfirmationText !== "DELETE"}
                                    className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                    {deleteAccountMutation.isPending ? "Deleting..." : "Permanently Delete Account"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showUpgrade && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 relative animate-in zoom-in duration-200 border border-brand-blue/10">
                            <button
                                onClick={() => { setShowUpgrade(false); setOtpSent(false); setError(""); setMessage(""); }}
                                className="absolute top-4 right-4 text-brand-dark/40 hover:text-brand-dark/60"
                            >
                                ✕
                            </button>
                            <h3 className="text-2xl font-bold text-brand-dark mb-6">Verify Phone Number</h3>
                            {message && <div className="mb-4 p-3 bg-brand-green/10 text-brand-green rounded-lg text-sm">{message}</div>}
                            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                            {!otpSent ? (
                                <div className="space-y-4">
                                    <p className="text-brand-dark/70">To become a landlord, we need to verify your phone number.</p>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark/70 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={phoneInput}
                                            onChange={(e) => setPhoneInput(e.target.value)}
                                            placeholder="Enter 10-digit number"
                                            className="w-full px-4 py-2 border border-brand-blue/20 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => upgradeMutation.mutate({ action: "send_phone_otp", phone: phoneInput })}
                                        disabled={upgradeMutation.isPending}
                                        className="w-full bg-brand-blue text-white py-3 rounded-lg font-bold hover:bg-brand-blue/90 transition-colors"
                                    >
                                        {upgradeMutation.isPending ? "Sending..." : "Send OTP"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-brand-dark/70">Enter the OTP sent to <strong>{phoneInput}</strong>.</p>
                                    <div>
                                        <label className="block text-sm font-medium text-brand-dark/70 mb-1">OTP Code</label>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="Enter OTP"
                                            className="w-full px-4 py-2 border border-brand-blue/20 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none text-center tracking-widest font-mono text-lg"
                                        />
                                    </div>
                                    <button
                                        onClick={() => upgradeMutation.mutate({ action: "verify_phone_otp", otp, phone: phoneInput })}
                                        disabled={upgradeMutation.isPending}
                                        className="w-full bg-brand-green text-white py-3 rounded-lg font-bold hover:bg-brand-green/90 transition-colors"
                                    >
                                        {upgradeMutation.isPending ? "Verifying..." : "Verify & Upgrade"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
