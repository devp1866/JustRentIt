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
import { LayoutDashboard, Users, Building, DollarSign, TrendingUp, ShieldCheck, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminDashboard() {
    const router = useRouter();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
    const [passwordForm, setPasswordForm] = React.useState({ current: '', new: '', confirm: '' });
    const [passwordMessage, setPasswordMessage] = React.useState({ type: '', text: '' });

    const [chartTimeframe, setChartTimeframe] = React.useState('sixMonths');

    const [viewAll, setViewAll] = React.useState(false);
    const [allTransactions, setAllTransactions] = React.useState([]);

    const [showScheduleModal, setShowScheduleModal] = React.useState(false);
    const [selectedEscrow, setSelectedEscrow] = React.useState(null);

    const handleViewAll = async () => {
        if (!viewAll) {
            // reload to be fresh
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

    const { stats, recentBookings, charts, adminProfile, escalatedTickets } = data;
    const chartData = charts?.[chartTimeframe] || [];

    const handleEscrowPayout = async (escrowId, type) => {
        const actionText = type === 'release_rent' ? 'release First Month Rent to Landlord' :
            type === 'release_deposit_to_renter' ? 'Return Deposit to Renter' :
                'Give Deposit to Landlord';
        if (!confirm(`Are you sure you want to ${actionText}? This cannot be undone.`)) return;

        try {
            const res = await fetch('/api/admin/payout-escrow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escrow_id: escrowId, type })
            });

            if (!res.ok) throw new Error('Failed to update escrow');

            window.location.reload();
        } catch (err) {
            alert(err.message);
        }
    };

    const handlePayout = async (bookingId) => {
        if (!confirm('Are you sure you want to mark this payout as PAID?')) return;

        try {
            const res = await fetch('/api/admin/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ booking_id: bookingId, action: 'mark_paid' })
            });

            if (!res.ok) throw new Error('Failed to update');

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
        <AdminLayout title="System Overview">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Overview</h1>
                        <p className="text-gray-500 mt-1">Platform performance and pending actions.</p>
                    </div>
                    <div className="text-right bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Logged in as</p>
                        <p className="text-brand-dark font-extrabold text-sm">{adminProfile?.email}</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${stats.totalRevenue.toLocaleString()}`}
                        icon={<DollarSign className="w-5 h-5 text-brand-blue" />}
                        trend="+12%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Total Bookings"
                        value={stats.totalBookings}
                        icon={<Users className="w-5 h-5 text-purple-600" />}
                        trend="+4%"
                        trendUp={true}
                    />
                    <StatCard
                        title="Active Listings"
                        value={stats.activeListings}
                        icon={<Building className="w-5 h-5 text-orange-600" />}
                        trend="-2%"
                        trendUp={false}
                    />
                    <StatCard
                        title="Escrow Funds Held"
                        value={`₹${(stats.totalEscrowHeld || 0).toLocaleString()}`}
                        icon={<ShieldCheck className="w-5 h-5 text-blue-600" />}
                        trend="Secured"
                        trendUp={true}
                    />
                    <StatCard
                        title="Escalated Tickets"
                        value={stats.escalatedCount || 0}
                        icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
                        trend="Urgent"
                        trendUp={false}
                    />
                </div>

                {/* Main Content Sections */}
                <div className="flex flex-col gap-12 mt-8">

                    {/* Section 1: Analytics & Revenue */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-extrabold text-[#1a1a1a] flex items-center gap-3">
                            <TrendingUp className="w-7 h-7 text-brand-blue" /> Analytics Explorer
                        </h2>
                        {/* Revenue Chart */}
                        <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-base font-bold text-gray-900 tracking-tight">Commission Growth</h3>
                                <select
                                    className="text-sm border-gray-200 rounded-lg text-gray-600 focus:ring-brand-blue/20"
                                    value={chartTimeframe}
                                    onChange={(e) => setChartTimeframe(e.target.value)}
                                >
                                    <option value="sevenDays">Last 7 Days</option>
                                    <option value="sixMonths">Last 6 Months</option>
                                    <option value="thisYear">This Year</option>
                                </select>
                            </div>
                            <div className="w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} barSize={40}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                                            tickFormatter={(value) => `₹${value}`}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`₹${value}`, "Revenue"]}
                                        />
                                        <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
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

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-brand-blue/30"
                                >
                                    Update Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function StatCard({ title, value, icon, trend, trendUp }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between group hover:shadow-md hover:border-brand-blue/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="bg-gray-50 p-2.5 rounded-lg group-hover:bg-brand-blue/5 transition-colors border border-gray-100">
                    {icon}
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-sm font-semibold text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
            </div>
        </div>
    );
}
