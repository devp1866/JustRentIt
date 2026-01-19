import React, { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, IndianRupee, Home as HomeIcon, TrendingUp, CheckCircle, Search, ArrowRight, Shield, Star, Users } from "lucide-react";
import PropertyCard from "../components/property/PropertyCard";
import SEO from "../components/SEO";

export default function Home() {
    const router = useRouter();
    const { data: session } = useSession();
    const user = session?.user;
    const [searchCity, setSearchCity] = useState("");
    const [propertyType, setPropertyType] = useState("all");
    const [rentalType, setRentalType] = useState("all");

    const { data: featuredProperties = [], isLoading } = useQuery({
        queryKey: ['featured-properties'],
        queryFn: async () =>
            fetch('/api/properties').then(res => res.json()),
    });

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchCity) params.append('city', searchCity);
        if (propertyType !== 'all') params.append('type', propertyType);
        if (rentalType !== 'all') params.append('rental_type', rentalType);
        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="min-h-screen bg-brand-cream font-sans selection:bg-brand-blue selection:text-white">
            <SEO
                title="JustRentIt - Premier Rental Marketplace"
                description="Find your dream rental home with JustRentIt. Browse thousands of verified listings for apartments, houses, and condos."
            />

            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-brand-cream" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-blue/20 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-brand-purple/20 via-transparent to-transparent" />
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-30" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
                    <div className="text-center max-w-4xl mx-auto mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-brand-blue/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-green"></span>
                            </span>
                            <span className="text-sm font-medium text-brand-dark/80">#1 Trusted Rental Platform</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-brand-dark tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                            Find Your Perfect <br />
                            <span className="text-gradient">Rental Home</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-brand-dark/60 mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            Discover quality properties from verified landlords. Simple, secure, and stress-free renting experience.
                        </p>

                        {/* Glass Search Bar */}
                        <div className="glass-panel rounded-3xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 mx-auto max-w-4xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-blue group-focus-within:text-brand-purple transition-colors" />
                                    <input
                                        placeholder="Enter city..."
                                        value={searchCity}
                                        onChange={e => setSearchCity(e.target.value)}
                                        className="pl-12 h-14 text-brand-dark w-full border border-brand-blue/10 rounded-2xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-white/50 transition-all hover:bg-white/80"
                                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <div className="relative">
                                    <select
                                        value={propertyType}
                                        onChange={e => setPropertyType(e.target.value)}
                                        className="h-14 text-brand-dark rounded-2xl border border-brand-blue/10 w-full px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none bg-white/50 transition-all hover:bg-white/80 appearance-none"
                                    >
                                        <option value="all">All Property Types</option>
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="condo">Condo</option>
                                        <option value="studio">Studio</option>
                                        <option value="villa">Villa</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <HomeIcon className="w-5 h-5 text-brand-dark/40" />
                                    </div>
                                </div>
                                <div className="relative">
                                    <select
                                        value={rentalType}
                                        onChange={e => setRentalType(e.target.value)}
                                        className="h-14 text-brand-dark rounded-2xl border border-brand-blue/10 w-full px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none bg-white/50 transition-all hover:bg-white/80 appearance-none"
                                    >
                                        <option value="all">All Rental Types</option>
                                        <option value="long_term">Long Term</option>
                                        <option value="short_term">Short Term</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <TrendingUp className="w-5 h-5 text-brand-dark/40" />
                                    </div>
                                </div>
                                <button
                                    onClick={handleSearch}
                                    className="h-14 bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white font-bold rounded-2xl shadow-lg shadow-brand-blue/20 hover:shadow-brand-blue/40 transition-all transform hover:-translate-y-0.5"
                                >
                                    <Search className="w-5 h-5 mr-2 inline" />
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-12 border-t border-brand-dark/5">
                        {[
                            { label: "Active Listings", value: "5,000+" },
                            { label: "Happy Tenants", value: "12,000+" },
                            { label: "Cities", value: "50+" },
                            { label: "Verified Landlords", value: "2,500+" },
                        ].map((stat, idx) => (
                            <div key={idx} className="text-center">
                                <p className="text-3xl font-bold text-brand-dark mb-1">{stat.value}</p>
                                <p className="text-sm text-brand-dark/50 font-medium uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="text-brand-blue font-bold tracking-wider uppercase text-sm mb-2 block">Why Choose Us</span>
                        <h2 className="text-4xl font-bold text-brand-dark mb-4">Everything you need to rent</h2>
                        <p className="text-xl text-brand-dark/60 max-w-2xl mx-auto">We&apos;ve streamlined the entire rental process to make it easier for both landlords and tenants.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Shield,
                                title: "Verified Properties",
                                desc: "Every property is physically verified by our team to ensure authenticity.",
                                color: "text-brand-blue",
                                bg: "bg-brand-blue/10"
                            },
                            {
                                icon: IndianRupee,
                                title: "Secure Payments",
                                desc: "Your money is safe with our escrow-like payment system until you move in.",
                                color: "text-brand-yellow",
                                bg: "bg-brand-yellow/10"
                            },
                            {
                                icon: CheckCircle,
                                title: "Instant Booking",
                                desc: "No more waiting. Book your dream home instantly with real-time availability.",
                                color: "text-brand-green",
                                bg: "bg-brand-green/10"
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="group p-8 rounded-3xl bg-brand-cream/30 border border-brand-dark/5 hover:border-brand-blue/20 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-brand-dark mb-3">{feature.title}</h3>
                                <p className="text-brand-dark/60 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-24 bg-brand-dark relative overflow-hidden text-white">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-blue/10 to-transparent"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-16">
                        <div className="md:w-1/2">
                            <span className="text-brand-yellow font-bold tracking-wider uppercase text-sm mb-2 block">How It Works</span>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple steps to your <br /><span className="text-brand-blue">new home</span></h2>
                            <p className="text-white/60 text-lg mb-8">Skip the brokers and paperwork. We&apos;ve digitized the entire rental journey for you.</p>

                            <div className="space-y-8">
                                {[
                                    { step: "01", title: "Search", desc: "Filter by city, budget, and amenities to find your match." },
                                    { step: "02", title: "Book", desc: "Pay a small token amount to reserve the property instantly." },
                                    { step: "03", title: "Move In", desc: "Sign the digital agreement and get the keys. It&apos;s that simple." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <span className="text-4xl font-bold text-brand-dark/20 stroke-text">{item.step}</span>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-1">{item.title}</h4>
                                            <p className="text-white/50">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="md:w-1/2 relative">
                            <div className="relative z-10 glass-panel-dark p-8 rounded-3xl border border-white/10 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                    <div className="w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold">John Doe</p>
                                        <p className="text-xs text-white/50">Just booked a flat in Mumbai</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                                    <div className="h-24 bg-brand-blue/20 rounded-xl mt-4 flex items-center justify-center border border-brand-blue/30">
                                        <CheckCircle className="w-8 h-8 text-brand-blue" />
                                    </div>
                                </div>
                            </div>
                            {/* Decorative blobs */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-purple/30 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-brand-blue/30 rounded-full blur-3xl"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-24 bg-brand-cream relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-brand-purple font-bold tracking-wider uppercase text-sm mb-2 block">Exclusive Listings</span>
                            <h2 className="text-4xl font-bold text-brand-dark mb-4">Featured Properties</h2>
                            <p className="text-xl text-brand-dark/60">Handpicked premium properties just for you</p>
                        </div>
                        <button
                            onClick={() => router.push("/properties")}
                            className="hidden md:flex items-center gap-2 text-brand-blue font-bold hover:text-brand-dark transition-colors group"
                        >
                            View All Properties <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-96 bg-white rounded-3xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {featuredProperties.slice(0, 3).map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}

                    <div className="mt-12 text-center md:hidden">
                        <button
                            onClick={() => router.push("/properties")}
                            className="bg-white border-2 border-brand-blue text-brand-blue px-8 py-3 rounded-xl font-bold w-full"
                        >
                            View All Properties
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-brand-purple"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="glass-panel p-12 rounded-[2.5rem] border border-white/20 shadow-2xl">
                        {user && user.user_type === 'renter' ? (
                            <>
                                <h2 className="text-4xl font-bold text-brand-dark mb-6">Ready to become a Landlord?</h2>
                                <p className="text-xl text-brand-dark/70 mb-10 max-w-2xl mx-auto">
                                    Unlock the potential of your property. Upgrade your account to start listing properties and earning passive income today.
                                </p>
                                <button
                                    onClick={() => router.push("/profile")}
                                    className="px-10 py-4 bg-brand-dark text-white hover:bg-brand-blue font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                                >
                                    Become a Landlord
                                </button>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-bold text-brand-dark mb-6">List Your Property Today</h2>
                                <p className="text-xl text-brand-dark/70 mb-10 max-w-2xl mx-auto">
                                    Join thousands of landlords who trust JustRentIt. Connect with verified renters and manage everything in one place.
                                </p>
                                <button
                                    onClick={() => router.push("/add-property")}
                                    className="px-10 py-4 bg-brand-dark text-white hover:bg-brand-blue font-bold rounded-xl text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1"
                                >
                                    List Your Property
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>
        </div >
    );
}

function User({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
