import React from 'react';
import Head from 'next/head';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AlertTriangle, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function ResolutionCenter() {
    const { data: session } = useSession();

    const { data, isLoading } = useQuery({
        queryKey: ['dispute-tickets'],
        queryFn: async () => {
            const res = await fetch('/api/tickets');
            if (!res.ok) throw new Error('Failed to fetch tickets');
            return res.json();
        },
        enabled: !!session,
    });

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'open':
                return { label: 'Action Required', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle };
            case 'under_review':
                return { label: 'Under Admin Review', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
            case 'escalated':
                return { label: 'Escalated', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle };
            case 'resolved':
            case 'closed':
                return { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: MessageSquare };
        }
    };

    return (
        <>
            <Head>
                <title>Resolution Center | JustRentIt</title>
            </Head>
            <div className="min-h-screen bg-brand-cream/30 flex flex-col">
                <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl mt-20">
                    <div className="mb-8 border-b border-gray-200 pb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resolution Center</h1>
                        <p className="text-gray-600">Track and manage your dispute tickets. Respond to claims within the 48-hour window.</p>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse bg-white h-32 rounded-2xl border border-gray-100 shadow-sm"></div>
                            ))}
                        </div>
                    ) : data?.tickets?.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear</h3>
                            <p className="text-gray-500">You don't have any active or past disputes.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data?.tickets?.map((ticket) => {
                                const StatusConfig = getStatusDisplay(ticket.status);
                                const Icon = StatusConfig.icon;
                                const isReporter = ticket.reporter_id === session?.user?.id; // Note: session might not have user ID easily exposed without JWT, but UI just shows generic data first.

                                return (
                                    <Link href={`/resolution-center/${ticket._id}`} key={ticket._id}>
                                        <div className="block bg-white rounded-2xl shadow-sm border border-gray-200 hover:border-brand-blue hover:shadow-md transition-all cursor-pointer overflow-hidden relative group">
                                            <div className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${StatusConfig.color}`}>
                                                                <Icon className="w-3.5 h-3.5" />
                                                                {StatusConfig.label}
                                                            </span>
                                                            <span className="text-sm text-gray-500 font-medium">#{ticket._id.slice(-6).toUpperCase()}</span>
                                                        </div>
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-blue transition-colors">
                                                            {ticket.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 mt-1">Property: {ticket.property_id?.title}</p>
                                                    </div>

                                                    <div className="flex items-center gap-6 text-sm">
                                                        <div className="text-right">
                                                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Claim Amount</p>
                                                            <p className="font-bold text-gray-900 line-clamp-1">
                                                                {ticket.claim_amount > 0 ? `₹${ticket.claim_amount.toLocaleString()}` : "No monetary claim"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right hidden sm:block">
                                                            <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Filed On</p>
                                                            <p className="font-medium text-gray-900">{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</p>
                                                        </div>
                                                        <div className="text-brand-blue font-bold group-hover:translate-x-1 transition-transform">
                                                            &rarr;
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
