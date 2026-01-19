import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, PlusCircle, Upload, X } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";

export default function EditProperty() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = router.query;

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
        },
        rooms: [] // For Hotels/Resorts
    });
    const [amenityInput, setAmenityInput] = useState("");
    const [uploadingRooms, setUploadingRooms] = useState({});

    // Fetch existing property data
    const { data: property, isLoading: isLoadingProperty } = useQuery({
        queryKey: ['property', id],
        queryFn: async () => {
            const res = await fetch(`/api/properties/${id}`);
            if (!res.ok) throw new Error('Failed to fetch property');
            return res.json();
        },
        enabled: !!id,
    });

    // Populate form when data is loaded
    useEffect(() => {
        if (property) {
            setFormData({
                title: property.title || "",
                description: property.description || "",
                rental_type: property.rental_type || "long_term",
                property_type: property.property_type || "apartment",
                location: property.location || "",
                city: property.city || "",
                bedrooms: property.bedrooms || 1,
                bathrooms: property.bathrooms || 1,
                area_sqft: property.area_sqft || 0,
                price_per_month: property.price_per_month || 0,
                price_per_night: property.price_per_night || 0,
                amenities: property.amenities || [],
                images: property.images || [],
                status: property.status || "available",
                offer: property.offer || {
                    enabled: false,
                    required_duration: 0,
                    discount_percentage: 0
                },
                rooms: property.rooms || []
            });
        }
    }, [property]);

    const updatePropertyMutation = useMutation({
        mutationFn: async (propertyData) =>
            fetch(`/api/properties/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(propertyData),
            }).then((res) => {
                if (!res.ok) throw new Error('Failed to update property');
                return res.json();
            }),
        onSuccess: () => {
            alert("Property updated successfully!");
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
        if (formData.rental_type === 'short_term' && !formData.price_per_night && !['hotel', 'resort'].includes(formData.property_type)) {
            alert("Please enter nightly price");
            return;
        }

        // Multi-Room Validation
        if (['hotel', 'resort'].includes(formData.property_type)) {
            if (!formData.rooms || formData.rooms.length === 0) {
                alert("Please add at least one room type for your hotel/resort.");
                return;
            }
            const validRooms = formData.rooms.every(r => r.name && r.count > 0 && (r.price_per_night || r.price_per_month));
            if (!validRooms) {
                alert("Please ensure all rooms have a name, inventory count, and price.");
                return;
            }
        }

        updatePropertyMutation.mutate({
            ...formData,
            landlord_email: user.email,
        });
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (!formData.title) {
            alert("Please enter a property title first before uploading images.");
            return;
        }

        setUploading(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const data = new FormData();
                data.append("file", file);
                data.append("type", "property");
                data.append("propertyName", formData.title);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: data,
                });

                if (!res.ok) {
                    throw new Error("Failed to upload image");
                }

                const json = await res.json();
                return json.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls],
            }));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload images. Please try again.");
        } finally {
            setUploading(false);
        }
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

    // --- MULTI-ROOM HANDLERS ---
    const addRoom = () => {
        setFormData(prev => ({
            ...prev,
            rooms: [...prev.rooms, {
                name: "",
                price_per_night: 0,
                price_per_month: 0,
                capacity: 2,
                count: 1,
                amenities: [],
                images: [],
                bedrooms: 1,
                bathrooms: 1,
                available: true
            }]
        }));
    };

    const removeRoom = (index) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter((_, i) => i !== index)
        }));
    };

    const updateRoom = (index, field, value) => {
        setFormData(prev => {
            const newRooms = [...prev.rooms];
            newRooms[index] = { ...newRooms[index], [field]: value };
            return { ...prev, rooms: newRooms };
        });
    };

    const handleRoomImageUpload = async (e, roomIndex) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setUploadingRooms(prev => ({ ...prev, [roomIndex]: true }));
        try {
            const uploadPromises = files.map(async (file) => {
                const data = new FormData();
                data.append("file", file);
                data.append("type", "room");
                data.append("propertyName", formData.title);

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: data,
                });

                if (!res.ok) throw new Error("Failed to upload image");
                const json = await res.json();
                return json.url;
            });

            const uploadedUrls = await Promise.all(uploadPromises);

            setFormData(prev => {
                const newRooms = [...prev.rooms];
                newRooms[roomIndex] = {
                    ...newRooms[roomIndex],
                    images: [...newRooms[roomIndex].images, ...uploadedUrls]
                };
                return { ...prev, rooms: newRooms };
            });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Failed to upload images.");
        } finally {
            setUploadingRooms(prev => ({ ...prev, [roomIndex]: false }));
        }
    };

    // --- AUTH GUARD ---
    if (status === "loading" || isLoadingProperty) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            </div>
        );
    }
    if (!user) {
        signIn(undefined, { callbackUrl: `/edit-property/${id}` });
        return null;
    }

    if (user.user_type !== "landlord" && user.user_type !== "both") {
        router.push("/dashboard");
        return null;
    }

    // Verify ownership
    if (property && property.landlord_email !== user.email) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
                    <p className="text-gray-600">You do not have permission to edit this property.</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mt-4 px-4 py-2 bg-blue-900 text-white rounded"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Property</h1>
                    <p className="text-gray-600">Update your property details</p>
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
                                <label htmlFor="status">Status</label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                >
                                    <option value="available">Available</option>
                                    <option value="rented">Rented</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                        </div>

                        {/* Offers Section */}
                        <div className="border-t pt-6 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Special Offers</h3>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="offer_enabled"
                                        checked={formData.offer?.enabled || false}
                                        onChange={e => setFormData({
                                            ...formData,
                                            offer: { ...formData.offer, enabled: e.target.checked }
                                        })}
                                        className="h-4 w-4 text-blue-900 focus:ring-blue-900 border-gray-300 rounded"
                                    />
                                    <label htmlFor="offer_enabled" className="ml-2 block text-sm text-gray-900">
                                        Enable Offer
                                    </label>
                                </div>
                            </div>

                            {formData.offer?.enabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-xl">
                                    <div>
                                        <label htmlFor="required_duration">
                                            Required Duration ({formData.rental_type === 'short_term' ? 'Days' : 'Months'})
                                        </label>
                                        <input
                                            id="required_duration"
                                            type="number"
                                            min="1"
                                            value={formData.offer?.required_duration || 0}
                                            onChange={e => setFormData({
                                                ...formData,
                                                offer: { ...formData.offer, required_duration: parseInt(e.target.value) }
                                            })}
                                            className="mt-1 w-full border px-3 py-2 rounded"
                                            placeholder={formData.rental_type === 'short_term' ? "e.g., 5 days" : "e.g., 6 months"}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="discount_percentage">Discount Percentage (%)</label>
                                        <input
                                            id="discount_percentage"
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={formData.offer?.discount_percentage || 0}
                                            onChange={e => setFormData({
                                                ...formData,
                                                offer: { ...formData.offer, discount_percentage: parseFloat(e.target.value) }
                                            })}
                                            className="mt-1 w-full border px-3 py-2 rounded"
                                            placeholder="e.g., 10%"
                                        />
                                    </div>
                                    <div className="md:col-span-2 text-sm text-blue-800">
                                        <p>
                                            Preview: Buy for {formData.offer?.required_duration || 0} {formData.rental_type === 'short_term' ? 'days' : 'months'} and get {formData.offer?.discount_percentage || 0}% discount.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="location">Full Address *</label>
                                <input
                                    id="location"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="123 Main Street, Apt 4B"
                                    className="mt-1 w-full border px-3 py-2 rounded"
                                    required
                                />
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

                    {/* Property Details / Room Configuration */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">
                            {['hotel', 'resort'].includes(formData.property_type) ? "Room Configuration" : "Property Details"}
                        </h2>

                        {['hotel', 'resort'].includes(formData.property_type) ? (
                            <div className="space-y-6">
                                {formData.rooms && formData.rooms.map((room, index) => (
                                    <div key={index} className="bg-gray-50 p-6 rounded-xl border border-gray-200 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeRoom(index)}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <h3 className="font-bold text-gray-800 mb-4">Room Type {index + 1}</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                                                <input
                                                    value={room.name}
                                                    onChange={e => updateRoom(index, 'name', e.target.value)}
                                                    placeholder="e.g. Deluxe Suite"
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Count *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={room.count}
                                                    onChange={e => updateRoom(index, 'count', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={room.bedrooms || 1}
                                                    onChange={e => updateRoom(index, 'bedrooms', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={room.bathrooms || 1}
                                                    onChange={e => updateRoom(index, 'bathrooms', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={room.capacity}
                                                    onChange={e => updateRoom(index, 'capacity', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {formData.rental_type === 'short_term' ? 'Price per Night (₹)' : 'Price per Month (₹)'} *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.rental_type === 'short_term' ? room.price_per_night : room.price_per_month}
                                                    onChange={e => updateRoom(index, formData.rental_type === 'short_term' ? 'price_per_night' : 'price_per_month', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Room Images */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Room Images</label>
                                            <div className="flex flex-wrap gap-2">
                                                {room.images && room.images.map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative w-20 h-20">
                                                        <Image src={img} alt="Room" fill className="object-cover rounded-lg" />
                                                    </div>
                                                ))}
                                                <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                                                    <input type="file" multiple accept="image/*" onChange={(e) => handleRoomImageUpload(e, index)} className="hidden" disabled={uploadingRooms[index]} />
                                                    {uploadingRooms[index] ? (
                                                        <Loader2 className="w-6 h-6 text-blue-900 animate-spin" />
                                                    ) : (
                                                        <PlusCircle className="w-6 h-6 text-gray-400" />
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addRoom}
                                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-blue-900 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    Add Another Room Type
                                </button>
                            </div>
                        ) : (
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
                        )}
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
                            disabled={updatePropertyMutation.isPending}
                        >
                            {updatePropertyMutation.isPending ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                                    Updating Property...
                                </>
                            ) : (
                                "Update Property"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
