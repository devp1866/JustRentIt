import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Home, Building2, PlusCircle, User, LogOut, Menu, X } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

import Head from "next/head";

export default function Layout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const path = router.pathname;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = React.useRef(null);

  // Close profile menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const isAuthPage = path === "/login" || path === "/signup";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>JustRentIt - Find Your Perfect Rental Home</title>
        <meta name="description" content="Discover quality rental properties from verified landlords. Simple, secure, and stress-free renting with JustRentIt." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="JustRentIt - Find Your Perfect Rental Home" />
        <meta property="og:description" content="Discover quality rental properties from verified landlords. Simple, secure, and stress-free renting with JustRentIt." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="JustRentIt" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style>{`
        :root {
          --primary: #2563EB;
          --primary-dark: #1d4ed8;
          --accent: #F59E0B;
          --accent-dark: #d97706;
        }
      `}</style>

      {/* Header */}
      <header className="bg-brand-cream/90 backdrop-blur-md border-b border-brand-blue/20 sticky top-0 z-50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-brand-dark tracking-tight">JustRentIt</span>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigationItems.filter(item => item.show).map((item) => (
                <Link
                  key={item.title}
                  href={item.url}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${isActive(item.url)
                    ? "bg-brand-blue text-white font-medium shadow-md transform scale-105"
                    : "text-brand-dark/70 hover:bg-brand-blue/10 hover:text-brand-dark"
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
                    <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.user_type || "renter"}</p>
                  </div>
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      className={`flex items-center gap-2 border rounded px-3 py-2 hover:bg-gray-50 ${profileMenuOpen ? 'bg-gray-50 ring-2 ring-blue-100' : ''}`}
                    >
                      <User className="w-4 h-4" />
                      <span>Account</span>
                    </button>
                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50">
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        <Link
                          href="/help-center"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Help Center
                        </Link>
                        <button
                          onClick={() => { setProfileMenuOpen(false); signOut(); }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signIn()}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark font-semibold rounded-full px-6 py-2 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.url)
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
                      <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.user_type || "renter"}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      Profile
                    </Link>
                    <Link
                      href="/help-center"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                      <User className="w-5 h-5" />
                      Help Center
                    </Link>
                    <button
                      onClick={() => { setMobileMenuOpen(false); signOut(); }}
                      className="w-full border rounded px-4 py-2 flex gap-2 items-center justify-center"
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
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      {!isAuthPage && (
        <footer className="bg-brand-blue/10 border-t border-brand-blue/20 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue/80 rounded-xl flex items-center justify-center shadow-lg">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-brand-dark">JustRentIt</span>
                </div>
                <p className="text-sm text-brand-dark/70">
                  Your trusted platform for finding and listing rental properties. Simple, secure, and reliable.
                </p>
              </div>

              {/* Role-based Sections */}
              {(!user || user.user_type === 'renter' || user.user_type === 'both') && (
                <div>
                  <h3 className="font-semibold text-brand-dark mb-4">For Renters</h3>
                  <ul className="space-y-2 text-sm text-brand-dark/70">
                    <li>
                      <Link href="/properties" className="hover:text-brand-blue transition-colors">Browse Properties</Link>
                    </li>
                    {user && (
                      <li>
                        <Link href="/dashboard" className="hover:text-brand-blue transition-colors">My Bookings</Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {(!user || user.user_type === 'landlord' || user.user_type === 'both') && (
                <div>
                  <h3 className="font-semibold text-brand-dark mb-4">For Landlords</h3>
                  <ul className="space-y-2 text-sm text-brand-dark/70">
                    <li>
                      <Link href="/add-property" className="hover:text-brand-blue transition-colors">List Property</Link>
                    </li>
                    {user && (
                      <li>
                        <Link href="/dashboard" className="hover:text-brand-blue transition-colors">Manage Listings</Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-brand-dark mb-4">Company</h3>
                <ul className="space-y-2 text-sm text-brand-dark/70">
                  <li>
                    <Link href="/about" className="hover:text-brand-blue transition-colors">About Us</Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-brand-blue transition-colors">Contact Us</Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:text-brand-blue transition-colors">Terms of Service</Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-brand-blue transition-colors">Privacy Policy</Link>
                  </li>
                  <li>
                    <Link href="/help-center" className="hover:text-brand-blue transition-colors">Help Center</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-brand-blue/20 text-center text-sm text-brand-dark/60">
              © 2025 JustRentIt. All rights reserved.
            </div>
          </div>
        </footer>
      )}

    </div >
  );
}

function Loader() {
  return (
    <span className="inline-block animate-spin text-blue-900">
      <svg className="w-5 h-5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
    </span>
  );
}
