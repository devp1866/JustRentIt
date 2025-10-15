// pages/properties.js

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/home/PropertyCard";


export default function Properties() {
    const router = useRouter();

    const searchCityDefault = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get('city') || "" : "";
    const propertyTypeDefault = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get('type') || "all" : "all";

    const [searchCity, setSearchCity] = useState(searchCityDefault);
    const [propertyType, setPropertyType] = useState(propertyTypeDefault);
    const [priceRange, setPriceRange] = useState("all");

    const { data: properties = [], isLoading } = useQuery({
        queryKey: ['properties'],
        queryFn: async () => fetch('/api/properties').then(res => res.json()),
    });



    const filteredProperties = properties.filter(property => {
        const cityMatch = !searchCity || property.city?.toLowerCase().includes(searchCity.toLowerCase());
        const typeMatch = propertyType === "all" || property.property_type === propertyType;
        let priceMatch = true;
        if (priceRange === "low") priceMatch = property.price_per_month < 1000;
        else if (priceRange === "mid") priceMatch = property.price_per_month >= 1000 && property.price_per_month <= 2500;
        else if (priceRange === "high") priceMatch = property.price_per_month > 2500;

        return cityMatch && typeMatch && priceMatch;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Browse Properties</h1>
                    <p className="text-gray-600">Find your perfect rental from our collection</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            placeholder="Search by city..."
                            value={searchCity}
                            onChange={(e) => setSearchCity(e.target.value)}
                            className="h-11 rounded border px-3"
                        />
                        <select
                            value={propertyType}
                            onChange={e => setPropertyType(e.target.value)}
                            className="h-11 rounded border px-3"
                        >
                            <option value="all">All Types</option>
                            <option value="apartment">Apartment</option>
                            <option value="house">House</option>
                            <option value="condo">Condo</option>
                            <option value="studio">Studio</option>
                            <option value="villa">Villa</option>
                        </select>
                        <select
                            value={priceRange}
                            onChange={e => setPriceRange(e.target.value)}
                            className="h-11 rounded border px-3"
                        >
                            <option value="all">All Prices</option>
                            <option value="low">Under $1,000</option>
                            <option value="mid">$1,000 - $2,500</option>
                            <option value="high">Above $2,500</option>
                        </select>
                        <button
                            onClick={() => {
                                setSearchCity('');
                                setPropertyType('all');
                                setPriceRange('all');
                            }}
                            className="h-11 border rounded px-3 bg-gray-100 font-semibold"
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>

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
