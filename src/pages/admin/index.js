import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { LayoutDashboard, Users, Building, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';

export default function AdminDashboard() {
    // const { data: session, status } = useSession(); // Removed NextAuth session
    const router = useRouter();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
    const [passwordForm, setPasswordForm] = React.useState({ current: '', new: '', confirm: '' });
    const [passwordMessage, setPasswordMessage] = React.useState({ type: '', text: '' });

    // View All Transactions State
    const [viewAll, setViewAll] = React.useState(false);
    const [allTransactions, setAllTransactions] = React.useState([]);

    const handleViewAll = async () => {
        if (!viewAll) {
            // Load all transactions if not already loaded (or reload to be fresh)
            try {
                const res = await fetch('/api/admin/transactions');
                const data = await res.json();
                if (res.ok) {
                    setAllTransactions(data.bookings);
                }
            } catch (error) {
                console.error("Failed to load transactions", error);
            }
        }
        setViewAll(!viewAll);
    };

    // We rely on API failure to determine auth status now
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch('/api/admin/stats');
            if (res.status === 401 || res.status === 403) {
                throw new Error('Access Denied');
            }
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        },
        retry: false
    });

    // Handle Access Denied by redirecting to login
    useEffect(() => {
        if (isError && error.message === 'Access Denied') {
            // Add a small delay/check to avoid hydration mismatch or rapid loops
            router.replace('/admin/login');
        }
    }, [isError, error, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                    <p className="text-gray-500">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-700">Access Denied</h2>
                    <p className="text-gray-500 mb-4">Redirecting to login...</p>
                    {/* Fallback button if redirect fails */}
                    <button
                        onClick={() => router.push('/admin/login')}
                        className="text-brand-blue underline"
                    >
                        Click here to login
                    </button>
                    <p className="text-xs text-red-400 mt-4">Error: {error.message}</p>
                </div>
            </div>
        );
    }

    const { stats, recentBookings, chartData, adminProfile } = data;

    const handlePayout = async (bookingId) => {
        if (!confirm('Are you sure you want to mark this payout as PAID?')) return;

        try {
            const res = await fetch('/api/admin/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId, action: 'mark_paid' })
            });

            if (!res.ok) throw new Error('Failed to update');

            // Reload to refresh data
            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });

        if (passwordForm.new !== passwordForm.confirm) {
            setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        try {
            const res = await fetch('/api/admin/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.current,
                    newPassword: passwordForm.new
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Failed to change password');

            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordForm({ current: '', new: '', confirm: '' });
                setPasswordMessage({ type: '', text: '' });
            }, 2000);
        } catch (err) {
            setPasswordMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-12 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-[#1a1a1a] flex items-center gap-3 tracking-tight">
                            <span className="bg-brand-blue/10 p-2 rounded-xl">
                                <LayoutDashboard className="w-8 h-8 text-brand-blue" />
                            </span>
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Detailed overview of platform performance.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full shadow-sm border border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {adminProfile?.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">{adminProfile?.name || 'Administrator'}</p>
                            <div className="flex gap-3 mt-1">
                                <button
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    className="text-xs text-brand-blue hover:underline font-medium"
                                >
                                    Change Password
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={async () => {
                                        await fetch('/api/admin/logout', { method: 'POST' });
                                        router.push('/admin/login');
                                    }}
                                    className="text-xs text-red-500 hover:underline font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        icon={<DollarSign className="w-7 h-7 text-white" />}
                        gradient="from-blue-600 to-blue-400"
                        subtext="Platform Commission (10%)"
                    />
                    <StatCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<Users className="w-7 h-7 text-white" />}
                        gradient="from-purple-600 to-purple-400"
                        subtext="All time bookings"
                    />
                    <StatCard
                        title="Active Listings"
                        value={stats.activeListings}
                        icon={<Building className="w-7 h-7 text-white" />}
                        gradient="from-orange-500 to-orange-400"
                        subtext="Properties live now"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                    {/* Revenue Chart */}
                    <div className="xl:col-span-3 bg-white p-8 rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Monthly Commission Revenue
                            </h3>
                            <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm text-gray-600 outline-none">
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barSize={60}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                                        tickFormatter={(value) => `₹${value}`}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="url(#colorRevenue)" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="xl:col-span-3 bg-white rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {viewAll ? 'All Transactions' : 'Recent Transactions'}
                            </h3>
                            <button
                                onClick={handleViewAll}
                                className="text-sm text-brand-blue font-bold hover:underline"
                            >
                                {viewAll ? 'Show Less' : 'View All'}
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Property</th>
                                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Renter</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Total Amount</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-brand-blue uppercase tracking-wider">Commission (10%)</th>
                                        <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Landlord Payout</th>
                                        <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(viewAll ? allTransactions : recentBookings).length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-8 py-12 text-center text-gray-500">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        (viewAll ? allTransactions : recentBookings).map((booking, i) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <p className="font-bold text-gray-900">{booking.property_title}</p>
                                                    <p className="text-xs text-gray-400 mt-1">ID: #{booking._id?.slice(-6).toUpperCase()}</p>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                            {booking.renter_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{booking.renter_name || "Unknown Renter"}</p>
                                                            <p className="text-xs text-gray-400">Renter</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-right font-medium text-gray-600">
                                                    ₹{booking.total_amount?.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="bg-blue-50 text-brand-blue px-3 py-1 rounded-full text-sm font-bold border border-blue-100">
                                                        +₹{booking.platform_fee?.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-right font-medium text-gray-600">
                                                    ₹{booking.landlord_payout_amount?.toLocaleString()}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                        ${booking.payout_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {booking.payout_status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {booking.payout_status !== 'paid' && (
                                                        <button
                                                            onClick={() => handlePayout(booking._id)}
                                                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs font-bold transition-colors"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>


            {/* Change Password Modal */}
            {
                isPasswordModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-900">Change Admin Password</h3>
                                <button
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 outline-none"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                                {passwordMessage.text && (
                                    <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                        {passwordMessage.text}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.current}
                                        onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.new}
                                        onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirm}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-brand-blue/30"
                                >
                                    Update Password
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function StatCard({ title, value, icon, gradient, subtext }) {
    return (
        <div className="bg-white p-8 rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 hover:transform hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-bold text-gray-400 tracking-wide uppercase mb-1">{title}</p>
                    <h3 className="text-4xl font-extrabold text-[#1a1a1a] tracking-tight">{value}</h3>
                    {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br ${gradient}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
