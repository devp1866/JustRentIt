// pages/index.js

import React, { useState } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, DollarSign, Home as HomeIcon, TrendingUp, CheckCircle, Search } from "lucide-react";
import PropertyCard from "../components/home/PropertyCard";

const mockProperties = [
    {
        id: "1",
        title: "Sunny Apartment",
        location: "Downtown City",
        property_type: "apartment",
        bedrooms: 2,
        bathrooms: 1,
        area_sqft: 850,
        price_per_month: 1200,
        amenities: ["Pool", "Gym", "Parking"],
        images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"],
        status: "available",
        landlord_email: "owner@example.com",
        description: "A bright, well-located apartment."
    },
    {
        id: "2",
        title: "Cozy Studio",
        location: "Central Avenue",
        property_type: "studio",
        price_per_month: 950,
        amenities: [],
        images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
        status: "available",
        landlord_email: "owner2@example.com",
        description: "Perfect for singles or students."
    }
];

export default function Home() {
    const router = useRouter();
    const [searchCity, setSearchCity] = useState("");
    const [propertyType, setPropertyType] = useState("all");

    // Use mockProperties for demo!
    const { data: featuredProperties = [], isLoading } = useQuery({
        queryKey: ['featured-properties'],
        queryFn: async () =>
            fetch('/api/properties').then(res => res.json()),
    });


    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchCity) params.append('city', searchCity);
        if (propertyType !== 'all') params.append('type', propertyType);
        router.push(`/properties?${params.toString()}`);
    };

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600')] bg-cover bg-center opacity-10"></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Find Your Perfect
                            <span className="block text-amber-400">Rental Home</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 mb-12">
                            Discover quality properties from verified landlords. Simple, secure, and stress-free.
                        </p>
                        {/* Search Bar */}
                        <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        placeholder="Enter city..."
                                        value={searchCity}
                                        onChange={e => setSearchCity(e.target.value)}
                                        className="pl-10 h-12 text-gray-900 w-full border border-gray-300 rounded"
                                        onKeyPress={e => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <select
                                    value={propertyType}
                                    onChange={e => setPropertyType(e.target.value)}
                                    className="h-12 text-gray-900 rounded border border-gray-300 w-full"
                                >
                                    <option value="all">All Types</option>
                                    <option value="apartment">Apartment</option>
                                    <option value="house">House</option>
                                    <option value="condo">Condo</option>
                                    <option value="studio">Studio</option>
                                    <option value="villa">Villa</option>
                                </select>
                                <button
                                    onClick={handleSearch}
                                    className="h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded"
                                >
                                    <Search className="w-5 h-5 mr-2 inline" />
                                    Search Properties
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <TrendingUp className="w-8 h-8 text-blue-900" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Wide Selection</h3>
                            <p className="text-gray-600">Browse thousands of verified rental properties in your area</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payments</h3>
                            <p className="text-gray-600">Safe and encrypted payment processing for your peace of mind</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Booking</h3>
                            <p className="text-gray-600">Simple booking process with instant confirmation</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-16 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Properties</h2>
                            <p className="text-gray-600">Handpicked properties just for you</p>
                        </div>
                        <button
                            onClick={() => router.push("/properties")}
                            className="hidden md:flex border border-blue-900 text-blue-900 px-4 py-2 rounded"
                        >
                            View All Properties
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featuredProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                    <div className="mt-8 text-center md:hidden">
                        <button
                            onClick={() => router.push("/properties")}
                            className="border border-blue-900 text-blue-900 px-4 py-2 rounded"
                        >
                            View All Properties
                        </button>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-r from-blue-900 to-blue-800 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <HomeIcon className="w-16 h-16 mx-auto mb-6 opacity-80" />
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Own a Property?</h2>
                    <p className="text-xl text-blue-100 mb-8">
                        List your property on JustRentIt and connect with verified renters today
                    </p>
                    <button
                        onClick={() => router.push("/add-property")}
                        className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded text-lg"
                    >
                        List Your Property
                    </button>
                </div>
            </section>
        </div>
    );
}
