import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Building2, PlusCircle, User, LogOut, Menu, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = router.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User info from NextAuth session
  const user = session?.user;

  const navigationItems = [
    {
      title: "Home",
      url: "/",
      icon: Home,
      show: true
    },
    {
      title: "Browse Properties",
      url: "/properties",
      icon: Building2,
      show: true
    },
    {
      title: "List Property",
      url: "/add-property",
      icon: PlusCircle,
      show: user && (user.user_type === "landlord" || user.user_type === "both")
    },
    {
      title: "My Dashboard",
      url: "/dashboard",
      icon: User,
      show: user
    }
  ];

  const isActive = (url) => path === url;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --primary: #1e3a8a;
          --primary-dark: #1e40af;
          --accent: #f59e0b;
          --accent-dark: #d97706;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">JustRentIt</span>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive(item.url)
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              ))}
            </nav>
            {/* User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {status === "loading" ? (
                <Loader />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.user_type || "renter"}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="border rounded px-4 py-2 flex gap-2 items-center"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="bg-blue-900 hover:bg-blue-800 text-white rounded px-4 py-2"
                >
                  Sign In
                </button>
              )}
            </div>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive(item.url)
                      ? "bg-blue-50 text-blue-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200">
                {status === "loading" ? (
                  <Loader />
                ) : user ? (
                  <div className="space-y-3">
                    <div className="px-4">
                      <p className="text-sm font-medium text-gray-900">{user.full_name || user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.user_type || "renter"}</p>
                    </div>
                    <button
                      onClick={() => { setMobileMenuOpen(false); signOut(); }}
                      className="w-full border rounded px-4 py-2 flex gap-2 items-center"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMobileMenuOpen(false); signIn(); }}
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white rounded px-4 py-2"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">JustRentIt</span>
              </div>
              <p className="text-sm text-gray-600">
                Your trusted platform for finding and listing rental properties.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Renters</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/properties" className="hover:text-blue-900">Browse Properties</Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-blue-900">My Bookings</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">For Landlords</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="/add-property" className="hover:text-blue-900">List Property</Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-blue-900">Manage Listings</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>About Us</li>
                <li>Contact</li>
                <li>Terms of Service</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-600">
            © 2025 JustRentIt. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple loader icon for async "loading" states
function Loader() {
  return (
    <span className="inline-block animate-spin text-blue-900">
      <svg className="w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
    </span>
  );
}
