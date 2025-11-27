import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, IndianRupee } from "lucide-react";
import PropertyCard from "../components/property/PropertyCard";
import Head from "next/head";

export default function Properties() {
    const router = useRouter();

    const propertyTypeDefault = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get('type') || "all" : "all";
    const rentalTypeDefault = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get('rental_type') || "all" : "all";

    const [searchCity, setSearchCity] = useState("");
    const [propertyType, setPropertyType] = useState(propertyTypeDefault);
    const [rentalType, setRentalType] = useState(rentalTypeDefault);
    const [priceRange, setPriceRange] = useState("all");

    const [showOffers, setShowOffers] = useState(false);

    // Initialize searchCity from URL param
    useEffect(() => {
        if (typeof window !== "undefined") {
            const city = new URLSearchParams(window.location.search).get('city');
            if (city) setSearchCity(city);
        }
    }, []);

    const { data: properties = [], isLoading } = useQuery({
        queryKey: ['properties'],
        queryFn: async () => fetch('/api/properties').then(res => res.json()),
    });

    const filteredProperties = properties.filter(property => {
        const searchTerm = searchCity.toLowerCase();
        const cityMatch = !searchCity ||
            property.city?.toLowerCase().includes(searchTerm) ||
            property.location?.toLowerCase().includes(searchTerm);

        const typeMatch = propertyType === "all" || property.property_type === propertyType;
        const rentalMatch = rentalType === "all" || property.rental_type === rentalType;

        let priceMatch = true;
        const price = property.rental_type === 'short_term' ? property.price_per_night * 30 : property.price_per_month;

        if (priceRange === "under_2k") priceMatch = price < 2000;
        else if (priceRange === "2k_5k") priceMatch = price >= 2000 && price <= 5000;
        else if (priceRange === "5k_20k") priceMatch = price > 5000 && price <= 20000;
        else if (priceRange === "20k_50k") priceMatch = price > 20000 && price <= 50000;
        else if (priceRange === "above_50k") priceMatch = price > 50000;

        return cityMatch && typeMatch && rentalMatch && priceMatch;
    });

    const offerProperties = properties.filter(p => p.offer && p.offer.enabled);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Head>
                <title>Browse Properties - JustRentIt</title>
                <meta name="description" content="Search and filter through our extensive collection of rental properties. Find apartments, houses, and studios in your preferred location." />
            </Head>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Properties</h1>
                    <p className="text-gray-600">Find your perfect rental from our collection</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600 hidden sm:block">
                                Check out special offers!
                            </span>
                            <button
                                onClick={() => setShowOffers(!showOffers)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${showOffers
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:shadow-md hover:scale-105'
                                    }`}
                            >
                                <IndianRupee className={`w-4 h-4 ${showOffers ? 'text-gray-600' : 'text-white'}`} />
                                {showOffers ? 'Hide Offers' : 'View Special Offers'}
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <input
                            type="text"
                            placeholder="Search by city or location"
                            value={searchCity}
                            onChange={e => setSearchCity(e.target.value)}
                            className="h-11 rounded border px-3"
                        />
                        <select
                            value={propertyType}
                            onChange={e => setPropertyType(e.target.value)}
                            className="h-11 rounded border px-3"
                        >
                            <option value="all">All Property Types</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="condo">Condo</option>
                            <option value="studio">Studio</option>
                            <option value="villa">Villa</option>
                            <option value="pg">PG</option>
                            <option value="hotel">Hotel</option>
                            <option value="resort">Resort</option>
                        </select>
                        <select
                            value={rentalType}
                            onChange={e => setRentalType(e.target.value)}
                            className="h-11 rounded border px-3"
                        >
                            <option value="all">All Rental Types</option>
                            <option value="long_term">Long Term</option>
                            <option value="short_term">Short Term</option>
                        </select>
                        <select
                            value={priceRange}
                            onChange={e => setPriceRange(e.target.value)}
                            className="h-11 rounded border px-3"
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
                            }}
                            className="h-11 border rounded px-3 bg-gray-100 font-semibold"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

                {/* Special Offers Section */}
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

                {/* Results */}
                <div className="mb-6">
                    <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{filteredProperties.length}</span> properties
                    </p>
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
                ) : filteredProperties.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
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
