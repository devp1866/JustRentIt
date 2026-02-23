import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { AlertCircle, Clock, CheckCircle, Send, ShieldAlert, Image as ImageIcon, Send as SendIcon, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

export default function TicketDetails() {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const chatEndRef = useRef(null);

    const [message, setMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [zoomedImage, setZoomedImage] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ['ticket', id],
        queryFn: async () => {
            if (!id) return;
            const res = await fetch(`/api/tickets/${id}`);
            if (!res.ok) throw new Error('Failed to fetch ticket');
            return res.json();
        },
        enabled: !!id && !!session,
    });

    const sendMessageMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error('Failed to send message');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['ticket', id]);
            setMessage("");
            setFiles([]);
        }
    });

    const escalateMutation = useMutation({
        mutationFn: async ({ action }) => {
            const res = await fetch(`/api/tickets/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: "update_status", newStatus: action === 'close' ? "resolved" : "escalated" })
            });
            if (!res.ok) throw new Error(`Failed to ${action} ticket`);
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['ticket', id]);
            if (variables.action === 'close') {
                alert("Ticket has been marked as resolved and closed.");
            } else {
                alert("Ticket escalated to JustRentIt Support.");
            }
        }
    });

    const ticket = data?.ticket;

    // Auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [ticket?.chat_logs]);

    if (isLoading || !ticket) {
        return <div className="min-h-screen bg-brand-cream/30 flex items-center justify-center animate-pulse">Loading...</div>;
    }

    // Identify roles relative to current session for UI rendering
    const isReporter = ticket.reporter_id?.email === session?.user?.email;
    const isAccused = ticket.accused_id?.email === session?.user?.email;

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
        <>
            <Head>
                <title>Ticket #{ticket._id.slice(-6)} | Resolution Center</title>
            </Head>
            <div className="min-h-screen bg-brand-cream/30 flex flex-col">
                <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl mt-20">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Left Column: Ticket Details */}
                        <div className="w-full lg:w-1/3 space-y-6">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border 
                    ${ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${ticket.status === 'escalated' ? 'bg-red-100 text-red-800' : ''}
                    ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : ''}
                  `}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-gray-500 font-medium text-sm">#{ticket._id.slice(-6).toUpperCase()}</span>
                                </div>

                                <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
                                <div className="max-h-48 overflow-y-auto mb-6 pr-2 custom-scrollbar">
                                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between pb-4 border-b border-gray-100">
                                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Property</span>
                                        <span className="font-semibold text-gray-900">{ticket.property_id?.title}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-gray-100">
                                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Claim Amount</span>
                                        <span className="font-bold text-red-600">₹{ticket.claim_amount?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between pb-4 border-b border-gray-100">
                                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">48H Deadline</span>
                                        <span className="font-semibold text-brand-blue">{format(new Date(ticket.deadline), 'MMM d, h:mm a')}</span>
                                    </div>
                                    <p className="text-xs text-brand-dark/50 mt-1 italic">Tickets close automatically after 7 days if unresolved.</p>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 text-sm font-bold uppercase tracking-wide">Reporter Role</span>
                                        <span className="font-semibold capitalize text-brand-blue">{ticket.reporter_role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Initial Evidence Gallery */}
                            {ticket.initial_evidence?.length > 0 && (
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-gray-400" /> Initial Evidence
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

                            {/* Action Box */}
                            {ticket.status === 'open' && isReporter && (
                                <div className="bg-brand-blue/5 rounded-3xl p-6 border border-brand-blue/20">
                                    <h3 className="font-bold text-brand-dark mb-4 flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 text-brand-blue" /> Reporter Actions
                                    </h3>
                                    <p className="text-sm text-brand-dark/70 mb-4">
                                        If the other party is uncooperative, you can escalate this ticket to Support. If you have reached an agreement, you can close this ticket.
                                    </p>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => escalateMutation.mutate({ action: 'escalate' })}
                                            disabled={escalateMutation.isPending}
                                            className="w-full py-3 bg-white border border-brand-dark/20 text-brand-dark font-bold rounded-xl hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                                        >
                                            Escalate to Platform Admins
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("Are you sure you want to resolve and close this ticket? This action cannot be undone.")) {
                                                    escalateMutation.mutate({ action: 'close' });
                                                }
                                            }}
                                            disabled={escalateMutation.isPending}
                                            className="w-full py-3 bg-brand-green/10 text-brand-green border border-brand-green/20 font-bold rounded-xl hover:bg-brand-green/20 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> Mark as Resolved & Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Chat Interface */}
                        <div className="w-full lg:w-2/3 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[700px]">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-900">Secure Dispute Chat</h2>
                                <p className="text-xs text-gray-500 mt-1">All messages are recorded and can be used in platform or legal escalations.</p>
                            </div>

                            <div className="flex-grow p-6 overflow-y-auto space-y-6 bg-gray-50/50">
                                {ticket.chat_logs?.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-20">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No messages yet.</p>
                                        {isAccused && <p className="text-sm">Please respond to the claim.</p>}
                                    </div>
                                ) : (
                                    ticket.chat_logs.map((log, i) => {
                                        const isMe = log.sender_id === session?.user?.id ||
                                            (isReporter && log.sender_role === ticket.reporter_role) ||
                                            (isAccused && log.sender_role !== ticket.reporter_role && log.sender_role !== "admin");

                                        const isAdmin = log.sender_role === "admin";

                                        return (
                                            <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl p-4 ${isAdmin ? 'bg-red-50 border border-red-100 text-gray-900' :
                                                    isMe ? 'bg-brand-blue text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                                    }`}>
                                                    <div className={`text-xs font-bold mb-1 opacity-70 ${isAdmin ? 'text-red-600' : isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                                                        {isAdmin ? 'PLATFORM ADMIN' : log.sender_role.toUpperCase()}
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

                                                    <div className={`text-[10px] text-right mt-2 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
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
                                        <div className="flex gap-2 mb-3 overflow-x-auto pb-2 border-b border-gray-50">
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
                                            placeholder="Type your response or negotiation offer..."
                                            className="flex-grow bg-gray-50 border border-gray-200 rounded-2xl p-3 outline-none focus:ring-2 focus:ring-brand-blue/50 resize-none h-12 max-h-32 text-sm"
                                            rows="1"
                                        />
                                        <button
                                            type="submit"
                                            disabled={sendMessageMutation.isPending || uploading || (!message.trim() && files.length === 0)}
                                            className="shrink-0 p-3 bg-brand-blue text-white rounded-2xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50 shadow-md shadow-brand-blue/20"
                                        >
                                            <SendIcon className="w-5 h-5" />
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-3xl text-center text-sm font-bold text-gray-500">
                                    This ticket has been resolved and closed.
                                </div>
                            )}
                        </div>

                    </div>
                </main>
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
        </>
    );
}
