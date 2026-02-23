import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '../../../components/admin/AdminLayout';
import {
    AlertCircle, Clock, CheckCircle, Send, ShieldAlert,
    Image as ImageIcon, Send as SendIcon, MessageSquare,
    CheckCircle2, X, ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

export default function AdminTicketDetails() {
    const router = useRouter();
    const { id } = router.query;
    const queryClient = useQueryClient();
    const chatEndRef = useRef(null);

    const [message, setMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);

    // Fetch from Admin API
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['admin-ticket', id],
        queryFn: async () => {
            if (!id) return;
            const res = await fetch(`/api/admin/tickets/${id}`);
            if (res.status === 401 || res.status === 403) {
                throw new Error('Access Denied');
            }
            if (!res.ok) throw new Error('Failed to fetch ticket');
            return res.json();
        },
        enabled: !!id,
        retry: false
    });

    useEffect(() => {
        if (isError && error.message === 'Access Denied') {
            router.replace('/admin/login');
        }
    }, [isError, error, router]);

    const sendMessageMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await fetch(`/api/admin/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-ticket', id]);
            setMessage("");
            setFiles([]);
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ action }) => {
            const res = await fetch(`/api/admin/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            if (!res.ok) throw new Error(`Failed to ${action} ticket`);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['admin-ticket', id]);
            if (variables.action === 'close') {
                alert("Ticket has been marked as resolved and closed.");
            }
        }
    });

    const ticket = data?.ticket;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.chat_logs]);

    if (isLoading || !ticket) {
        return (
            <AdminLayout title="Ticket Details">
                <div className="flex items-center justify-center py-20 animate-pulse">
                    <p className="text-gray-500 font-medium text-lg">Loading Ticket Data...</p>
                </div>
            </AdminLayout>
        );
    }

    if (isError) {
        return (
            <AdminLayout title="Ticket Details">
                <div className="p-8 text-center text-red-500 font-bold">Error loading ticket.</div>
            </AdminLayout>
        );
    }

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() && files.length === 0) return;

        let imageUrls = [];
        if (files.length > 0) {
            setUploading(true);
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('type', 'dispute');
                formData.append('bookingId', ticket.booking_id);

                try {
                    const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });
                    const d = await res.json();
                    if (res.ok && d.url) {
                        imageUrls.push(d.url);
                    }
                } catch (err) {
                    console.error("Upload error:", err);
                }
            }
            setUploading(false);
        }

        sendMessageMutation.mutate({
            action: "send_message",
            message,
            attachments: imageUrls
        });
    };

    return (
        <AdminLayout title={`Ticket #${ticket._id.slice(-6).toUpperCase()}`}>
            <div className="flex flex-col xl:flex-row gap-6 w-full h-[calc(100vh-100px)]">

                {/* Left Column: Ticket Details */}
                <div className="w-full xl:w-1/3 xl:min-w-[400px] flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2 pb-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                    ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : ''}
                                    ${ticket.status === 'escalated' ? 'bg-red-100 text-red-800' : ''}
                                    ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                                `}>
                                    {ticket.status}
                                </span>
                            </div>
                            <span className="text-gray-400 font-mono text-xs">#{ticket._id.slice(-6).toUpperCase()}</span>
                        </div>

                        <h1 className="text-xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
                        <div className="max-h-48 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                            <p className="text-gray-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between pb-4 border-b border-gray-50 flex-col gap-1">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Property</span>
                                <span className="font-bold text-gray-900 text-sm">{ticket.property_id?.title}</span>
                            </div>

                            <div className="flex justify-between pb-4 border-b border-gray-50 flex-col gap-1">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Reporter</span>
                                <span className="font-medium text-gray-800 text-sm capitalize">{ticket.reporter_id?.full_name} ({ticket.reporter_role})</span>
                            </div>

                            <div className="flex justify-between pb-4 border-b border-gray-50 flex-col gap-1">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Accused</span>
                                <span className="font-medium text-gray-800 text-sm capitalize">{ticket.accused_id?.full_name} ({ticket.reporter_role === 'renter' ? 'landlord' : 'renter'})</span>
                            </div>

                            <div className="flex justify-between pb-4 border-b border-gray-50 items-center">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">Claim Amount</span>
                                <span className="font-black text-red-600">₹{ticket.claim_amount?.toLocaleString() || 0}</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">48H Deadline</span>
                                <span className="font-bold text-brand-blue text-xs">{format(new Date(ticket.deadline), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Initial Evidence Gallery */}
                    {ticket.initial_evidence?.length > 0 && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                <ImageIcon className="w-4 h-4 text-gray-400" /> Initial Evidence
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {ticket.initial_evidence.map((url, i) => (
                                    <div
                                        key={i}
                                        className="relative h-24 rounded-xl overflow-hidden cursor-zoom-in hover:opacity-90 border border-gray-200"
                                        onClick={() => setZoomedImage(url)}
                                    >
                                        <Image src={url} alt={`Evidence ${i}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Admin Actions */}
                    {ticket.status !== 'resolved' && (
                        <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
                            <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" /> Admin Options
                            </h3>
                            <p className="text-xs text-red-800 mb-4">
                                Use administrative authority to force close this ticket if explicitly resolved.
                            </p>
                            <button
                                onClick={() => {
                                    if (window.confirm("FORCE CLOSE: Are you sure you want to administratively resolve and close this ticket?")) {
                                        statusMutation.mutate({ action: 'close' });
                                    }
                                }}
                                disabled={statusMutation.isPending}
                                className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Force Resolve & Close
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Column: Chat Interface */}
                <div className="w-full xl:flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[600px] h-full">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-3xl border-b-gray-100">
                        <div>
                            <h2 className="text-lg font-extrabold text-[#1a1a1a]">Dispute Chat Audit Log</h2>
                            <p className="text-xs text-gray-500 mt-1">You are viewing this chat as an Admin.</p>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-brand-blue opacity-20" />
                    </div>

                    <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-white custom-scrollbar">
                        {ticket.chat_logs?.length === 0 ? (
                            <div className="text-center text-gray-400 mt-20">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No messages in this dispute yet.</p>
                            </div>
                        ) : (
                            ticket.chat_logs.map((log, i) => {
                                const isAdmin = log.sender_role === "admin";
                                // Admin messages go right, user messages go left
                                const isMe = isAdmin;

                                return (
                                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl p-4 ${isAdmin ? 'bg-gray-900 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                            <div className={`text-[10px] font-black tracking-widest uppercase mb-1 ${isAdmin ? 'text-gray-400' : 'text-gray-400'}`}>
                                                {isAdmin ? 'ADMINISTRATOR' : log.sender_role}
                                            </div>
                                            <p className="text-sm whitespace-pre-wrap">{log.message}</p>

                                            {log.attachments?.length > 0 && (
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    {log.attachments.map((url, j) => (
                                                        <div
                                                            key={j}
                                                            className="relative h-20 rounded-lg overflow-hidden border border-black/10 cursor-zoom-in"
                                                            onClick={() => setZoomedImage(url)}
                                                        >
                                                            <Image src={url} alt="Attachment" fill className="object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className={`text-[10px] text-right mt-2 ${isMe ? 'text-gray-400' : 'text-gray-400'}`}>
                                                {format(new Date(log.created_at), 'MMM d, h:mm a')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Message Input */}
                    {(ticket.status === 'open' || ticket.status === 'escalated') ? (
                        <div className="p-4 border-t border-gray-100 bg-white rounded-b-3xl">
                            {files.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 border-b border-gray-50 custom-scrollbar">
                                    {files.map((f, i) => (
                                        <div key={i} className="bg-gray-100 text-xs px-2 py-1 flex items-center gap-1 rounded font-medium truncate max-w-[150px]">
                                            <ImageIcon className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                                <label className="shrink-0 p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
                                    <ImageIcon className="w-5 h-5" />
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setFiles(Array.from(e.target.files))}
                                    />
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Post an administrative message or demand..."
                                    className="flex-grow border-2 border-gray-100 rounded-2xl p-3 outline-none focus:border-brand-dark transition-colors resize-none h-12 max-h-32 text-sm font-medium"
                                    rows="1"
                                />
                                <button
                                    type="submit"
                                    disabled={sendMessageMutation.isPending || uploading || (!message.trim() && files.length === 0)}
                                    className="shrink-0 p-3 bg-brand-dark text-white rounded-2xl hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    <SendIcon className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 border-t border-gray-100 bg-green-50/50 rounded-b-3xl flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                            <p className="text-sm font-bold text-green-700">This ticket has been resolved and closed.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Image Zoom Modal */}
            {zoomedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
                        onClick={() => setZoomedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative w-full max-w-5xl max-h-[90vh] h-full" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={zoomedImage}
                            alt="Zoomed Evidence"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
