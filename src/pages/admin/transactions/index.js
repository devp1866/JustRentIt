import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Calendar, Search } from 'lucide-react';
import { format } from 'date-fns';
import AdminLayout from '../../../components/admin/AdminLayout';

export default function AdminTransactions() {
    const router = useRouter();
    const [showScheduleModal, setShowScheduleModal] = React.useState(false);
    const [selectedEscrow, setSelectedEscrow] = React.useState(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data: result, isLoading, isError, error } = useQuery({
        queryKey: ['admin-transactions'],
        queryFn: async () => {
            const res = await fetch('/api/admin/transactions');
            if (res.status === 401 || res.status === 403) {
                throw new Error('Access Denied');
            }
            if (!res.ok) throw new Error('Failed to fetch transactions');
            return res.json();
        },
        retry: false
    });

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
                    <p className="text-gray-500">Loading Transactions...</p>
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
                    <button
                        onClick={() => router.push('/admin/login')}
                        className="text-brand-blue underline"
                    >
                        Click here to login
                    </button>
                </div>
            </div>
        );
    }

    const transactions = result?.bookings || [];

    const filteredTransactions = transactions.filter(booking => {
        if (!searchQuery) return true;

        const query = searchQuery.toLowerCase();
        const dateStr = format(new Date(booking.createdAt), "MMM d, yyyy").toLowerCase();

        return (
            (booking.property_title && booking.property_title.toLowerCase().includes(query)) ||
            (booking.renter_email && booking.renter_email.toLowerCase().includes(query)) ||
            (booking.renter_name && booking.renter_name.toLowerCase().includes(query)) ||
            (booking._id && booking._id.toLowerCase().includes(query)) ||
            dateStr.includes(query)
        );
    });

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

    return (
        <AdminLayout title="Transactions">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Transactions</h1>
                        <p className="text-gray-500 mt-1">Manage payouts, escrows, and financial history.</p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by property, email, ID, or date (e.g. Oct 24)..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all outline-none text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                                    <th className="py-3 px-4 font-bold">Property & Guest</th>
                                    <th className="py-3 px-4 font-bold">Date</th>
                                    <th className="py-3 px-4 font-bold">Status</th>
                                    <th className="py-3 px-4 text-right font-bold w-48">Rent / Booking Fee</th>
                                    <th className="py-3 px-4 text-right font-bold w-36">Escrow Deposit</th>
                                    <th className="py-3 px-4 text-right font-bold">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-500">
                                            {searchQuery ? 'No transactions match your search.' : 'No transactions found'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((booking) => (
                                        <tr key={booking._id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-4 align-top">
                                                <div className="max-w-[200px]">
                                                    <p className="font-bold text-gray-900 truncate" title={booking.property_title}>{booking.property_title}</p>
                                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5" title={booking._id}>#{booking._id?.slice(-8).toUpperCase()}</p>
                                                    <p className="text-xs text-brand-blue truncate mt-1" title={booking.renter_email}>{booking.renter_email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 align-top">
                                                <span className="text-gray-600 text-sm">{format(new Date(booking.createdAt), "MMM d, yyyy")}</span>
                                            </td>
                                            <td className="py-3 px-4 align-top">
                                                {booking.escrow_data ? (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border 
                                                            ${booking.escrow_data.first_month_rent_status === 'held' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                            Rent: {booking.escrow_data.first_month_rent_status === 'held' ? 'Held' : 'Released'}
                                                        </span>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border 
                                                            ${booking.escrow_data.deposit_status === 'held' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                            Dep: {booking.escrow_data.deposit_status === 'held' ? 'Held' : 'Released'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border
                                                        ${booking.payout_status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                        {booking.payout_status === 'paid' ? 'Paid Out' : 'Pending'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 align-top text-right bg-brand-cream/10 border-l border-brand-cream border-dashed">
                                                {booking.escrow_data ? (
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <span className="font-bold text-gray-900">₹{booking.escrow_data.first_month_rent?.toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">1st MONTH</span>
                                                        <div className="flex flex-col items-end gap-0.5 mt-1 pt-1 border-t border-gray-100 w-full">
                                                            <span className="text-[9px] text-gray-400 font-medium tracking-wide">COMMISSION</span>
                                                            <span className="text-xs font-black text-brand-blue">+₹{booking.platform_fee?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <span className="font-bold text-gray-900">₹{(booking.total_amount - (booking.platform_fee || 0)).toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">TOTAL RENT (S-T)</span>
                                                        <div className="flex flex-col items-end gap-0.5 mt-1 pt-1 border-t border-gray-100 w-full">
                                                            <span className="text-[9px] text-gray-400 font-medium tracking-wide">COMMISSION</span>
                                                            <span className="text-xs font-black text-brand-blue">+₹{booking.platform_fee?.toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 align-top text-right">
                                                {booking.escrow_data ? (
                                                    <div className="flex flex-col gap-1 items-end">
                                                        <span className="font-bold text-brand-dark">₹{booking.escrow_data.deposit_amount?.toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-400 font-medium tracking-wide">PROTECT DEPOSIT</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic font-medium">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 align-top text-right">
                                                {booking.escrow_data ? (
                                                    <div className="flex flex-col gap-1.5 w-full max-w-[180px] ml-auto">
                                                        {booking.escrow_data.first_month_rent_status === 'held' && (
                                                            <span className="text-[10px] text-gray-500 italic text-center w-full px-2 py-1 bg-gray-50 rounded border border-gray-100">
                                                                Awaiting Renter Move-in
                                                            </span>
                                                        )}
                                                        {booking.escrow_data.deposit_status === 'held' && (
                                                            <div className="flex gap-1 justify-end w-full">
                                                                <button
                                                                    onClick={() => handleEscrowPayout(booking.escrow_data._id, 'release_deposit_to_renter')}
                                                                    className="text-white bg-green-600 hover:bg-green-700 px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm transition-colors flex-1 text-center border border-green-700"
                                                                    title="Return Deposit to Renter"
                                                                >
                                                                    Return Dep.
                                                                </button>
                                                                <button
                                                                    onClick={() => handleEscrowPayout(booking.escrow_data._id, 'release_deposit_to_landlord')}
                                                                    className="text-white bg-orange-600 hover:bg-orange-700 px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm transition-colors flex-1 text-center border border-orange-700"
                                                                    title="Give Deposit to Landlord (Damage/Dispute)"
                                                                >
                                                                    Give Landlord
                                                                </button>
                                                            </div>
                                                        )}
                                                        {booking.escrow_data.first_month_rent_status !== 'held' && booking.escrow_data.deposit_status !== 'held' && (
                                                            <span className="text-xs text-brand-green font-bold flex items-center justify-end">
                                                                <ShieldCheck className="w-3 h-3 mr-1" />
                                                                All Released
                                                            </span>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedEscrow(booking.escrow_data);
                                                                setShowScheduleModal(true);
                                                            }}
                                                            className="text-brand-blue bg-blue-50 hover:bg-blue-100 px-2 py-1.5 rounded-md text-[10px] font-bold shadow-sm transition-colors mt-1 w-full text-center border border-blue-200 flex items-center justify-center gap-1"
                                                        >
                                                            <Calendar className="w-3 h-3" />
                                                            View Schedule
                                                        </button>
                                                    </div>
                                                ) : (
                                                    booking.payout_status !== 'paid' && (
                                                        <button
                                                            onClick={() => handlePayout(booking._id)}
                                                            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors border border-green-700"
                                                        >
                                                            Pay Landlord
                                                        </button>
                                                    )
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

            {/* Payment Schedule Modal */}
            {showScheduleModal && selectedEscrow && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in duration-200 border border-brand-blue/10 max-h-[80vh] overflow-y-auto relative">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Escrow Payment Schedule</h3>
                                <p className="text-sm text-gray-500">Contract ID: {selectedEscrow._id}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowScheduleModal(false);
                                    setTimeout(() => setSelectedEscrow(null), 200);
                                }}
                                className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-brand-dark flex items-center gap-2">
                                        Initial Escrow <span className="text-[10px] font-normal px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-full">Month 1 + Deposit</span>
                                    </p>
                                    <p className="text-sm text-brand-dark/70">Paid upfront at checkout</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-brand-blue text-lg">₹{(selectedEscrow.first_month_rent + selectedEscrow.deposit_amount)?.toLocaleString()}</p>
                                    <span className="inline-block bg-brand-green/10 text-brand-green border border-brand-green/20 text-xs px-2 py-0.5 rounded-full font-bold mt-1">Paid</span>
                                </div>
                            </div>

                            {selectedEscrow.payment_schedule && selectedEscrow.payment_schedule.length > 0 ? (
                                selectedEscrow.payment_schedule.map((payment) => (
                                    <div key={payment.month_number} className="bg-white border border-gray-100 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-gray-900">Month {payment.month_number}</p>
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Due: {format(new Date(payment.due_date), "MMM d, yyyy")}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">₹{payment.amount?.toLocaleString()}</p>
                                            {payment.status === 'paid' || payment.status === 'pending_payout_to_landlord' || payment.status === 'released_to_landlord' ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="inline-block bg-brand-green/10 text-brand-green border border-brand-green/20 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold mt-1">Paid</span>
                                                    {payment.payment_id && <span className="text-[9px] text-gray-400 mt-1 font-mono">ID: {payment.payment_id}</span>}
                                                </div>
                                            ) : (
                                                <span className="inline-block bg-amber-50 text-amber-700 border border-amber-200 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-bold mt-1">Pending</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 text-sm border border-dashed border-gray-200 rounded-xl">
                                    No future payment schedule generated for this contract.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
