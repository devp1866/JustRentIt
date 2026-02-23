import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '../../../components/admin/AdminLayout';
import { AlertTriangle, Clock, Search, Filter, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminResolutionCenter() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [statusFilter, setStatusFilter] = React.useState("all");

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-tickets'],
        queryFn: async () => {
            const res = await fetch('/api/admin/tickets');
            if (res.status === 401 || res.status === 403) {
                throw new Error('Access Denied');
            }
            if (!res.ok) throw new Error('Failed to fetch tickets');
            return res.json();
        },
        retry: false
    });

    React.useEffect(() => {
        if (isError && error.message === 'Access Denied') {
            router.replace('/admin/login');
        }
    }, [isError, error, router]);

    if (isLoading) {
        return (
            <AdminLayout title="Resolution Center">
                <div className="flex items-center justify-center min-h-[50vh] animate-pulse">
                    <p className="text-gray-500 font-medium text-lg">Loading Tickets...</p>
                </div>
            </AdminLayout>
        );
    }

    if (isError) {
        return (
            <AdminLayout title="Resolution Center">
                <div className="p-8 text-center text-red-500 font-bold">Error loading tickets.</div>
            </AdminLayout>
        );
    }

    const tickets = data?.tickets || [];

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.property_id?.title?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <AdminLayout title="System Resolution Center">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">Resolution Center</h1>
                        <p className="text-gray-500 mt-1">Manage and arbitrate escalated platform disputes.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Ticket ID, Title, or Property..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all bg-gray-50/50"
                        />
                    </div>
                    <div className="relative shrink-0">
                        <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="pl-12 pr-10 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none bg-gray-50/50 font-medium text-gray-700"
                        >
                            <option value="all">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                    <th className="py-3 px-4">Ticket Details</th>
                                    <th className="py-3 px-4">Subject</th>
                                    <th className="py-3 px-4 text-right">Claim Amount</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4">Last Updated</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredTickets.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center text-gray-500">
                                            No tickets found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTickets.map(ticket => (
                                        <tr key={ticket._id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="py-3 px-4 align-top">
                                                <div className="font-bold text-gray-900 line-clamp-1" title={ticket.title}>{ticket.title}</div>
                                                <div className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wider">#{ticket._id.slice(-8).toUpperCase()}</div>
                                            </td>
                                            <td className="py-3 px-4 align-top">
                                                <div className="font-medium text-gray-900 line-clamp-1" title={ticket.property_id?.title}>{ticket.property_id?.title || 'Unknown Property'}</div>
                                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                    <span className="capitalize">{ticket.reporter_role}</span>
                                                    <span>•</span>
                                                    <span className="truncate max-w-[120px]" title="Unknown User">Unknown User</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 align-top text-right">
                                                <div className="font-bold text-gray-900">₹{ticket.claim_amount?.toLocaleString() || 0}</div>
                                            </td>
                                            <td className="py-3 px-4 align-top text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                                    ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                    ${ticket.status === 'escalated' ? 'bg-red-100 text-red-800 shadow-sm border border-red-200' : ''}
                                                    ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                                                `}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 align-top text-xs text-gray-500 font-medium">
                                                {format(new Date(ticket.updatedAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="py-3 px-4 align-top text-right">
                                                <button
                                                    onClick={() => router.push(`/admin/resolution-center/${ticket._id}`)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border
                                                        ${ticket.status === 'escalated'
                                                            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm border-red-700'
                                                            : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-sm'
                                                        }
                                                    `}
                                                >
                                                    {ticket.status === 'escalated' ? 'Review Dispute' : 'View Log'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
