// pages/property-details.js

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Bed, Bath, Square, Calendar, DollarSign, ArrowLeft, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function PropertyDetails() {
  const router = useRouter();
  const { id: propertyId } = router.query;

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    setUser(null);
  }, []);


  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      if (!propertyId) return null;
      const res = await fetch(`/api/properties/${propertyId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!propertyId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-32 mb-8 bg-gray-200 rounded animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="h-96 w-full bg-gray-200 rounded-2xl mb-4 animate-pulse" />
              <div className="grid grid-cols-4 gap-4">
                {Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
              </div>
            </div>
            <div>
              <div className="h-64 w-full bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property not found</h2>
          <button
            onClick={() => router.push("/properties")}
            className="py-2 px-4 border rounded bg-white shadow"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  const images =
    property.images?.length > 0
      ? property.images
      : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200"];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/properties")}
          className="mb-6 gap-2 border px-3 py-2 rounded flex items-center bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Properties
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-4">
              <div className="relative h-96">
                <Image
                  src={images[selectedImage]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-4 right-4 bg-white text-gray-900 font-semibold text-lg px-4 py-2 rounded">
                  ${property.price_per_month}/month
                </span>
              </div>
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-4 mb-8">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx
                        ? "border-blue-900"
                        : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <Image src={img} alt="" className="w-full h-24 object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Property Info */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{property.location}</span>
                  </div>
                </div>
                <span className="capitalize border px-2 py-1 rounded">
                  {property.property_type}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-6 py-6 border-y border-gray-200">
                {property.bedrooms && (
                  <div className="text-center">
                    <Bed className="w-8 h-8 mx-auto mb-2 text-blue-900" />
                    <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="text-center">
                    <Bath className="w-8 h-8 mx-auto mb-2 text-blue-900" />
                    <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                )}
                {property.area_sqft && (
                  <div className="text-center">
                    <Square className="w-8 h-8 mx-auto mb-2 text-blue-900" />
                    <p className="text-2xl font-bold text-gray-900">{property.area_sqft}</p>
                    <p className="text-sm text-gray-600">Sq Ft</p>
                  </div>
                )}
              </div>
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.description || "No description available."}
                </p>
              </div>
              {property.amenities?.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {property.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">Monthly Rent</p>
                <p className="text-4xl font-bold text-gray-900">
                  ${property.price_per_month}
                </p>
              </div>
              {property.status === "available" ? (
                <>
                  <button
                    onClick={() => {
                      if (!user) {
                        router.push(
                          `/login?redirect=/property-details?id=${propertyId}`
                        );
                      } else {
                        setShowBookingModal(true);
                      }
                    }}
                    className="w-full h-12 bg-blue-900 hover:bg-blue-800 text-lg font-semibold mb-4 text-white rounded"
                  >
                    <Calendar className="w-5 h-5 mr-2 inline" />
                    Book Now
                  </button>
                  <p className="text-sm text-gray-600 text-center">
                    {user
                      ? "Secure booking with instant confirmation"
                      : "Sign in to book this property"}
                  </p>
                </>
              ) : (
                <div className="text-center">
                  <span className="border px-3 py-1 bg-gray-200 text-gray-900 rounded mb-4">
                    Currently Unavailable
                  </span>
                  <p className="text-sm text-gray-600">
                    This property is not available for booking at the moment
                  </p>
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-900" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Secure Payment
                    </p>
                    <p className="text-xs text-gray-600">Protected transactions</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Verified Listing
                    </p>
                    <p className="text-xs text-gray-600">Property verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
