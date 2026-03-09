import React, { useState, useRef, useEffect } from 'react';
import { Bell, User, Check, Trash2, Home, CreditCard, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const queryClient = useQueryClient();
    const router = useRouter();

    // Close click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await fetch('/api/user/notifications');
            if (!res.ok) return [];
            return res.json();
        },
        refetchInterval: 3000 // Poll every 3s for near real-time feel
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            // Updated per user feedback: Mark all as read means deleting them all to declutter
            const res = await fetch('/api/user/notifications', { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to clear notifications");
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id) => {
            const res = await fetch(`/api/user/notifications/${id}`, { method: 'PUT' });
            if (!res.ok) throw new Error("Failed to mark as read");
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
             const res = await fetch(`/api/user/notifications/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error("Failed to delete Notification");
        },
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });

    const getIcon = (type) => {
        switch(type) {
            case 'booking': return <FileText className="w-5 h-5 text-brand-blue" />;
            case 'payment': return <CreditCard className="w-5 h-5 text-green-600" />;
            case 'property': return <Home className="w-5 h-5 text-orange-500" />;
            case 'system': return <ShieldAlert className="w-5 h-5 text-red-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const handleNotificationClick = (notif) => {
         if (!notif.is_read) {
             markAsReadMutation.mutate(notif._id);
         }
         
         if (notif.link) {
             setIsOpen(false);
             router.push(notif.link);
         }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Toggle notifications"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-[22rem] sm:w-[28rem] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden origin-top-right transform transition-all">
                    
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
                        {notifications.length > 0 && (
                            <button 
                                onClick={() => markAllAsReadMutation.mutate()}
                                className="text-xs font-semibold text-brand-blue hover:text-blue-800 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-blue"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12 px-4">
                                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 font-medium">You're all caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No new notifications.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        className={`group relative flex items-start p-5 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-[#f8fafc]' : 'bg-white'}`}
                                        onClick={() => handleNotificationClick(notif)}
                                    >
                                        <div className={`flex-shrink-0 mt-0.5 p-2.5 rounded-full shadow-sm border ${!notif.is_read ? 'bg-white border-blue-100' : 'bg-gray-50 border-gray-100'}`}>
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="ml-4 flex-1 min-w-0 pr-8">
                                            <p className={`text-[15px] leading-tight ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                {notif.title}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1.5 leading-snug">
                                                {notif.message}
                                            </p>
                                            <p className="text-[11px] font-semibold text-gray-400 mt-2.5 uppercase tracking-widest flex items-center gap-1.5">
                                                <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span>{new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </p>
                                        </div>
                                        
                                        {!notif.is_read && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-brand-blue rounded-r-md"></span>
                                        )}

                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteMutation.mutate(notif._id);
                                            }}
                                            className="absolute right-4 top-4 p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
