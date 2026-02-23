import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    LayoutDashboard,
    ShieldCheck,
    LogOut,
    Menu,
    X,
    Building,
    Users,
    AlertTriangle,
    CreditCard,
    ChevronRight,
    Search,
    Bell
} from 'lucide-react';

export default function AdminLayout({ children, title = 'Admin Dashboard' }) {
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // In a real app we'd fetch the profile, but we'll keep it simple here
    const handleLogout = async () => {
        await fetch('/api/admin/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
        { name: 'Transactions', path: '/admin/transactions', icon: <CreditCard className="w-5 h-5" /> },
        { name: 'Resolution Center', path: '/admin/resolution-center', icon: <AlertTriangle className="w-5 h-5" /> },
    ];

    // Generate breadcrumbs based on current path
    const pathSegments = router.pathname.split('/').filter(p => p && p !== 'admin');
    const breadcrumbs = [
        { name: 'Home', path: '/admin' },
        ...pathSegments.map((segment, index) => {
            const path = `/admin/${pathSegments.slice(0, index + 1).join('/')}`;
            // Format name: replace dashes with spaces, capitalize words
            const name = segment.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return { name, path };
        })
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-brand-dark">
            <Head>
                <title>{title} | JustRentIt Admin</title>
                <meta name="robots" content="noindex, nofollow" />
            </Head>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-[#0a0f1c]/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Dark Premium Theme) */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#0a0f1c] text-gray-300 border-r border-white/5 shadow-2xl lg:shadow-none
                transform transition-transform duration-300 ease-in-out flex flex-col font-medium
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white font-extrabold text-xl tracking-tight">
                        <div className="bg-brand-blue p-1.5 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        JustRentIt
                    </div>
                    <button
                        className="lg:hidden text-gray-400 hover:text-white transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-3">Overview</div>
                    {navItems.map((item) => {
                        const isActive = item.path === '/admin'
                            ? router.pathname === '/admin'
                            : router.pathname === item.path || router.pathname.startsWith(item.path + '/');
                        return (
                            <button
                                key={item.name}
                                onClick={() => {
                                    router.push(item.path);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-brand-blue/10 text-brand-blue font-bold shadow-inner border border-brand-blue/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <span className={`${isActive ? 'text-brand-blue' : 'text-gray-500 group-hover:text-gray-300'} transition-colors`}>
                                    {item.icon}
                                </span>
                                {item.name}
                            </button>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                                AD
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">Administrator</p>
                                <p className="text-[10px] text-gray-400 truncate">admin@justrentit.com</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Top Header Bar */}
                <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            className="lg:hidden text-gray-500 hover:text-brand-dark transition-colors bg-gray-50 p-1.5 rounded-md border border-gray-200"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {/* Breadcrumbs */}
                        <div className="hidden sm:flex items-center text-sm font-medium text-gray-500">
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.path}>
                                    {index > 0 && <ChevronRight className="w-4 h-4 mx-2 text-gray-300 shrink-0" />}
                                    <button
                                        onClick={() => router.push(crumb.path)}
                                        className={`hover:text-brand-blue transition-colors truncate max-w-[150px] ${index === breadcrumbs.length - 1 ? 'text-brand-dark font-bold' : ''}`}
                                    >
                                        {crumb.name}
                                    </button>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-brand-blue/20 focus-within:border-brand-blue transition-all">
                            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent border-none outline-none text-sm w-48 text-brand-dark placeholder-gray-400"
                            />
                        </div>
                        <button className="relative p-2 text-gray-400 hover:text-brand-dark transition-colors rounded-full hover:bg-gray-100">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-grow p-4 md:p-8 overflow-y-auto custom-scrollbar bg-[#f8fafc]">
                    <div className="max-w-7xl mx-auto w-full pb-12 animate-in fade-in zoom-in-95 duration-300">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
