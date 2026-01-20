import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, IndianRupee, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import PropertyCard from "../components/property/PropertyCard";
import SEO from "../components/SEO";

export default function Properties() {
    const router = useRouter();

    // Parse initial URL params
    const getInitialParam = (key, defaultVal) => {
        if (typeof window === "undefined") return defaultVal;
        return new URLSearchParams(window.location.search).get(key) || defaultVal;
    };

    const [searchCity, setSearchCity] = useState("");
    const [propertyType, setPropertyType] = useState("all");
    const [rentalType, setRentalType] = useState("all");
    const [priceRange, setPriceRange] = useState("all"); // mapped to min/max
    const [page, setPage] = useState(1);

    const [showOffers, setShowOffers] = useState(false);

    // Sync state with URL on mount
    useEffect(() => {
        if (router.isReady) {
            const { city, type, rental_type, price_range, page: pageParam } = router.query;
            if (city) setSearchCity(city);
            if (type) setPropertyType(type);
            if (rental_type) setRentalType(rental_type);
            if (price_range) setPriceRange(price_range);
            if (pageParam) setPage(parseInt(pageParam));
        }
    }, [router.isReady, router.query]);

    // Construct query string for API
    const fetchProperties = async () => {
        const params = new URLSearchParams();
        if (searchCity) params.append("search", searchCity);
        if (propertyType !== "all") params.append("property_type", propertyType);
        if (rentalType !== "all") params.append("rental_type", rentalType);
        params.append("page", page);
        params.append("limit", 9);

        // Price Logic
        if (priceRange !== "all") {
            if (priceRange === "under_2k") { params.append("price_max", 2000); }
            else if (priceRange === "2k_5k") { params.append("price_min", 2000); params.append("price_max", 5000); }
            else if (priceRange === "5k_20k") { params.append("price_min", 5000); params.append("price_max", 20000); }
            else if (priceRange === "20k_50k") { params.append("price_min", 20000); params.append("price_max", 50000); }
            else if (priceRange === "above_50k") { params.append("price_min", 50000); }
        }

        const res = await fetch(`/api/properties?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch properties');
        return res.json();
    };

    const { data, isLoading, isPreviousData } = useQuery({
        queryKey: ['properties', searchCity, propertyType, rentalType, priceRange, page],
        queryFn: fetchProperties,
        keepPreviousData: true,
        staleTime: 60000,
    });

    const properties = data?.properties || [];
    const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

    // Update URL on filter change (Debounce search could be added)
    const updateFilters = (key, value) => {
        setPage(1); // Reset to page 1 on filter change
        const query = { ...router.query, page: 1 };
        if (value && value !== 'all') query[key] = value;
        else delete query[key];

        // Special mapping for state updates
        if (key === 'city') setSearchCity(value);
        if (key === 'type') setPropertyType(value);
        if (key === 'rental_type') setRentalType(value);
        if (key === 'price_range') setPriceRange(value);

        router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
    };

    const handleSearch = (e) => {
        setSearchCity(e.target.value);
    };

    // Debounce Search update to URL to avoid lagging
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchCity !== (router.query.city || "")) {
                const query = { ...router.query, city: searchCity, page: 1 };
                if (!searchCity) delete query.city;
                router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchCity]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        const query = { ...router.query, page: newPage };
        router.push({ pathname: router.pathname, query }, undefined, { shallow: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const offerProperties = properties.filter(p => p.offer && p.offer.enabled);

    return (
        <div className="min-h-screen bg-brand-cream py-8 font-sans">
            <SEO
                title="Browse Properties"
                description="Search and filter through our extensive collection of rental properties. Find apartments, condos, studios and more."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">Browse Properties</h1>
                    <p className="text-brand-dark/60">Find your perfect rental from our collection</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-brand-blue/10 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-brand-blue" />
                            <h2 className="text-lg font-semibold text-brand-dark">Filters</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-brand-dark/60 hidden sm:block">
                                Check out special offers!
                            </span>
                            <button
                                onClick={() => setShowOffers(!showOffers)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${showOffers
                                    ? 'bg-brand-cream text-brand-dark hover:bg-brand-blue/5'
                                    : 'bg-gradient-to-r from-brand-yellow to-orange-500 text-white hover:shadow-md hover:scale-105'
                                    }`}
                            >
                                <IndianRupee className={`w-4 h-4 ${showOffers ? 'text-brand-dark' : 'text-white'}`} />
                                {showOffers ? 'Hide Offers' : 'View Special Offers'}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by city or location"
                                value={searchCity}
                                onChange={handleSearch}
                                className="w-full h-11 rounded-xl border border-brand-blue/20 pl-10 px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm"
                            />
                            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        </div>
                        <select
                            value={propertyType}
                            onChange={e => updateFilters('type', e.target.value)}
                            className="h-11 rounded-xl border border-brand-blue/20 px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm bg-white"
                        >
                            <option value="all">All Property Types</option>
                            <option value="apartment">Apartment</option>
                            <option value="condo">Condo</option>
                            <option value="studio">Studio</option>
                            <option value="villa">Villa</option>
                            <option value="hotel">Hotel</option>
                            <option value="resort">Resort</option>
                        </select>
                        <select
                            value={rentalType}
                            onChange={e => updateFilters('rental_type', e.target.value)}
                            className="h-11 rounded-xl border border-brand-blue/20 px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm bg-white"
                        >
                            <option value="all">All Rental Types</option>
                            <option value="long_term">Long Term</option>
                            <option value="short_term">Short Term</option>
                        </select>
                        <select
                            value={priceRange}
                            onChange={e => updateFilters('price_range', e.target.value)}
                            className="h-11 rounded-xl border border-brand-blue/20 px-4 focus:ring-2 focus:ring-brand-blue/50 outline-none text-sm bg-white"
                        >
                            <option value="all">All Prices</option>
                            <option value="under_2k">Under ₹2,000</option>
                            <option value="2k_5k">₹2,000 - ₹5,000</option>
                            <option value="5k_20k">₹5,000 - ₹20,000</option>
                            <option value="20k_50k">₹20,000 - ₹50,000</option>
                            <option value="above_50k">Above ₹50,000</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchCity('');
                                setPropertyType('all');
                                setRentalType('all');
                                setPriceRange('all');
                                setShowOffers(false);
                                setPage(1);
                                router.push({ pathname: router.pathname }, undefined, { shallow: true });
                            }}
                            className="h-11 border border-brand-blue/20 rounded-xl px-4 bg-brand-cream text-brand-dark font-semibold hover:bg-brand-blue/5 transition-colors text-sm"
                        >
                            Reset Filters
                        </button>
                    </div>

                    {/* Extra Filters for Hotels/Resorts */}
                    {['hotel', 'resort'].includes(propertyType) && (
                        <div className="mt-4 pt-4 border-t border-brand-blue/10 flex items-center gap-4">
                            <span className="text-sm font-medium text-brand-dark">Hotel Features:</span>
                            {['Pool', 'Spa', 'Gym', 'WiFi', 'Parking'].map(amenity => (
                                <label key={amenity} className="flex items-center gap-2 text-sm text-brand-dark/70 cursor-pointer">
                                    <input type="checkbox" className="rounded border-brand-blue/30 text-brand-blue focus:ring-brand-blue" />
                                    {amenity}
                                </label>
                            ))}
                            <span className="text-xs text-brand-dark/50 ml-auto italic">Feature filtering coming soon</span>
                        </div>
                    )}
                </div>

                {/* Special Offers (Filtered client side because logic is simple, or could be moved to API) */}
                {showOffers && offerProperties.length > 0 && (
                    <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="bg-red-100 p-2 rounded-full">
                                <IndianRupee className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Special Offers</h2>
                                <p className="text-gray-600 text-sm">Limited time deals on top rated properties</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {offerProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Results Count */}
                <div className="mb-6 flex justify-between items-end">
                    <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">
                            {properties.length}
                        </span> of <span className="font-semibold text-gray-900">{pagination.total}</span> properties
                    </p>
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />}
                </div>

                {/* Properties Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array(6).fill(0).map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md p-6">
                                <div className="h-56 w-full bg-gray-200 animate-pulse rounded mb-4" />
                                <div className="space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded" />
                                    <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                                    <div className="h-4 w-full bg-gray-200 animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {pagination.pages > 1 && (
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 rounded-full border border-brand-blue/20 hover:bg-brand-blue/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft className="w-6 h-6 text-brand-dark" />
                                </button>
                                <span className="font-medium text-brand-dark">
                                    Page {page} of {pagination.pages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(Math.min(pagination.pages, page + 1))}
                                    disabled={page === pagination.pages}
                                    className="p-2 rounded-full border border-brand-blue/20 hover:bg-brand-blue/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight className="w-6 h-6 text-brand-dark" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                        <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
                        <p className="text-gray-600">Try adjusting your filters to see more results</p>
                    </div>
                )}
            </div>
        </div>
    );
}
