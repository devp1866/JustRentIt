import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PlusCircle, Upload, X } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

export default function AddProperty() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Only get user from session (never use a mock)
    const user = session?.user || null;

    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        rental_type: "long_term",
        property_type: "apartment",
        location: "",
        city: "",
        bedrooms: 1,
        bathrooms: 1,
        area_sqft: 0,
        price_per_month: 0,
        price_per_night: 0,
        amenities: [],
        images: [],
        status: "available",
        offer: {
            enabled: false,
            required_duration: 0,
            discount_percentage: 0
        }
    });
    const [amenityInput, setAmenityInput] = useState("");
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedData = localStorage.getItem("add-property-form");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Exclude images from restoration
                const { images, ...rest } = parsed;
                setFormData(prev => ({ ...prev, ...rest }));
            } catch (e) {
                console.error("Failed to load saved form data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (!isLoaded) return;
        const { images, ...dataToSave } = formData;
        localStorage.setItem("add-property-form", JSON.stringify(dataToSave));
    }, [formData, isLoaded]);

    const createPropertyMutation = useMutation({
        mutationFn: async (propertyData) =>
            fetch("/api/properties", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(propertyData),
            }).then(async (res) => {
                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.message || 'Failed to create property');
                }
                return res.json();
            }),

        onSuccess: () => {
            alert("Property listed successfully!");
            localStorage.removeItem("add-property-form");
            queryClient.invalidateQueries({ queryKey: ['my-properties'] });
            router.push("/dashboard");
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (
            !formData.title ||
            !formData.location ||
            !formData.city
        ) {
            alert("Please fill in all required fields");
            return;
        }
        if (formData.rental_type === 'long_term' && !formData.price_per_month) {
            alert("Please enter monthly rent");
            return;
        }
        if (formData.rental_type === 'short_term' && !formData.price_per_night) {
            alert("Please enter nightly price");
            return;
        }
        createPropertyMutation.mutate({
            ...formData,
            landlord_email: user.email.toLowerCase(),
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        setUploading(true);
        // Mock upload: Replace with your API upload call
        const imageUrls = files.map((file) => URL.createObjectURL(file));
        setFormData((prev) => ({
            ...prev,
            images: [...prev.images, ...imageUrls],
        }));
        setUploading(false);
    };

    const removeImage = (index) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const addAmenity = () => {
        if (amenityInput.trim()) {
            setFormData((prev) => ({
                ...prev,
                amenities: [...prev.amenities, amenityInput.trim()],
            }));
            setAmenityInput("");
        }
    };

    const removeAmenity = (index) => {
        setFormData((prev) => ({
            ...prev,
            amenities: prev.amenities.filter((_, i) => i !== index),
        }));
    };

    // --- AUTH GUARD ---
    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
        );
    }
    if (!user) {
        signIn(undefined, { callbackUrl: "/add-property" });
        return null;
    }

    if (user.user_type !== "landlord" && user.user_type !== "both") {
        router.push("/dashboard");
        return null;
    }
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Property</h1>
                    <p className="text-gray-600">Fill in the details to list your property on JustRentIt</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title">Property Title *</label>
                                <input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Modern 2BR Apartment in Downtown"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your property..."
                                    rows={4}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            </div>

                            <div>
                                <label htmlFor="rental_type">Rental Type *</label>
                                <select
                                    id="rental_type"
                                    value={formData.rental_type}
                                    onChange={e => setFormData({ ...formData, rental_type: e.target.value })}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                >
                                    <option value="long_term">Long Term (Monthly)</option>
                                    <option value="short_term">Short Term (Daily/Weekly)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Long-term rentals are typically for 6+ months. Short-term are for holidays or temporary stays.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="property_type">Property Type *</label>
                                    <select
                                        value={formData.property_type}
                                        onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                                        className="mt-1 w-full border px-3 py-2 rounded"
                                    >
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="condo">Condo</option>
                                        <option value="studio">Studio</option>
                                        <option value="villa">Villa</option>
                                    </select>
                                </div>

                                <div>
                                    {formData.rental_type === 'short_term' ? (
                                        <>
                                            <label htmlFor="price_night">Nightly Price (₹) *</label>
                                            <input
                                                id="price_night"
                                                type="number"
                                                min="0"
                                                value={formData.price_per_night}
                                                onChange={e => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                                                className="mt-1 w-full border px-3 py-2 rounded"
                                                required
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="price">Monthly Rent (₹) *</label>
                                            <input
                                                id="price"
                                                type="number"
                                                min="0"
                                                value={formData.price_per_month}
                                                onChange={e => setFormData({ ...formData, price_per_month: parseFloat(e.target.value) })}
                                                className="mt-1 w-full border px-3 py-2 rounded"
                                                required
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="city">City *</label>
                                <input
                                    id="city"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="New York"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="bedrooms">Bedrooms</label>
                                <input
                                    id="bedrooms"
                                    type="number"
                                    min="0"
                                    value={formData.bedrooms}
                                    onChange={e => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            </div>
                            <div>
                                <label htmlFor="bathrooms">Bathrooms</label>
                                <input
                                    id="bathrooms"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={formData.bathrooms}
                                    onChange={e => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            </div>
                            <div>
                                <label htmlFor="area">Area (sq ft)</label>
                                <input
                                    id="area"
                                    type="number"
                                    min="0"
                                    value={formData.area_sqft}
                                    onChange={e => setFormData({ ...formData, area_sqft: parseInt(e.target.value) })}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Amenities</h2>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={amenityInput}
                                onChange={e => setAmenityInput(e.target.value)}
                                placeholder="Add amenity (e.g., Parking, Pool)"
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                className="border px-3 py-2 rounded w-full"
                            />
                            <button type="button" onClick={addAmenity} className="border rounded bg-white px-3 ">
                                <PlusCircle className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.amenities.map((amenity, idx) => (
                                <span key={idx} className="bg-gray-200 px-3 py-1 rounded flex items-center">
                                    {amenity}
                                    <button
                                        type="button"
                                        onClick={() => removeAmenity(idx)}
                                        className="ml-2 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    id="image-upload"
                                    disabled={uploading}
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                    {uploading
                                        ? <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-900 animate-spin" />
                                        : <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    }
                                    <p className="text-gray-600 mb-2">
                                        {uploading ? "Uploading..." : "Click to upload images"}
                                    </p>
                                    <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
                                </label>
                            </div>
                            {formData.images.length > 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative group h-32">
                                            <Image
                                                src={img}
                                                alt="Property preview"
                                                fill
                                                className="object-cover rounded-lg"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="flex-1 border rounded py-3 bg-white"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-900 hover:bg-blue-800 h-12 text-white font-semibold rounded"
                            disabled={createPropertyMutation.isPending}
                        >
                            {createPropertyMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                                    Listing Property...
                                </>
                            ) : (
                                "List Property"
                            )}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
}
