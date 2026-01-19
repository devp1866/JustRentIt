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
        furnishing_status: "unfurnished",
        required_duration: 0,
        discount_percentage: 0,
        rooms: [], // For Hotels/Resorts
        governance: new Array(9).fill(false)
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

    // Handle Property Type Side Effects
    useEffect(() => {
        if (formData.property_type === 'studio') {
            setFormData(prev => ({ ...prev, bedrooms: 1 }));
        }
        if (['hotel', 'resort'].includes(formData.property_type)) {
            setFormData(prev => ({ ...prev, furnishing_status: 'furnished' }));
        }
    }, [formData.property_type]);

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
            // Check valid rooms
            const validRooms = formData.rooms.every(r => r.name && r.price_per_night && r.count > 0);
            if (!validRooms && formData.rental_type === 'short_term') {
                // For simplified validation, checking price_per_night if short_term. 
                // ideally check price based on rental_type
                alert("Please ensure all rooms have a name, price, and inventory count.");
                return;
            }
        }

        // Governance Validation
        if (!formData.governance || !formData.governance.every(Boolean) || formData.governance.length !== 9) {
            alert("Please agree to all governance and safety rules to proceed.");
            return;
        }

        createPropertyMutation.mutate({
            ...formData,
            landlord_email: user.email.toLowerCase(),
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
                bedrooms: 1,
                bathrooms: 1,
                amenities: [],
                images: [],
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

    const [uploadingRooms, setUploadingRooms] = useState({}); // { index: boolean }

    const resetForm = (withConfirmation = true) => {
        if (withConfirmation && !confirm("Are you sure you want to clear the form? All data will be lost.")) {
            return;
        }
        localStorage.removeItem("add-property-form");
        setFormData({
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
            furnishing_status: "unfurnished",
            required_duration: 0,
            discount_percentage: 0,
            rooms: [],
            governance: new Array(9).fill(false)
        });
        setAmenityInput("");
        window.scrollTo(0, 0);
    };

    const handleRoomImageUpload = async (e, roomIndex) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        if (!formData.title) {
            alert("Please enter a property title first before uploading images.");
            return; // Exit early
        }

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

                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to upload image");
                }
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
        <div className="min-h-screen bg-brand-cream py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-brand-dark mb-2">List Your Property</h1>
                    <p className="text-brand-dark/70">Fill in the details to list your property on JustRentIt</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">Basic Information</h2>
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-brand-dark mb-1">Property Title *</label>
                                <input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g., Modern 2BR Apartment in Downtown"
                                    className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-brand-dark mb-1">Description</label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe your property..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all resize-none bg-brand-cream/20 text-brand-dark"
                                />
                            </div>

                            <div>
                                <label htmlFor="rental_type" className="block text-sm font-medium text-brand-dark mb-1">Rental Type *</label>
                                <select
                                    id="rental_type"
                                    value={formData.rental_type}
                                    onChange={e => setFormData({ ...formData, rental_type: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                >
                                    <option value="long_term">Long Term (Monthly)</option>
                                    <option value="short_term">Short Term (Daily/Weekly)</option>
                                </select>
                                <p className="text-xs text-brand-dark/50 mt-1">
                                    Long-term rentals are typically for 6+ months. Short-term are for holidays or temporary stays.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="property_type" className="block text-sm font-medium text-brand-dark mb-1">Property Type *</label>
                                    <select
                                        value={formData.property_type}
                                        onChange={e => setFormData({ ...formData, property_type: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    >
                                        <option value="apartment">Apartment</option>
                                        <option value="house">House</option>
                                        <option value="condo">Condo</option>
                                        <option value="studio">Studio</option>
                                        <option value="villa">Villa</option>
                                        <option value="hotel">Hotel</option>
                                        <option value="resort">Resort</option>
                                    </select>
                                </div>

                                {!['hotel', 'resort'].includes(formData.property_type) && (
                                    <div>
                                        <label htmlFor="furnishing_status" className="block text-sm font-medium text-brand-dark mb-1">Furnishing Status *</label>
                                        <select
                                            id="furnishing_status"
                                            value={formData.furnishing_status}
                                            onChange={e => setFormData({ ...formData, furnishing_status: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                        >
                                            <option value="unfurnished">Unfurnished</option>
                                            <option value="semi-furnished">Semi-Furnished</option>
                                            <option value="furnished">Furnished</option>
                                        </select>
                                    </div>
                                )}

                                <div>
                                    {formData.rental_type === 'short_term' ? (
                                        <>
                                            <label htmlFor="price_night" className="block text-sm font-medium text-brand-dark mb-1">Nightly Price (₹) *</label>
                                            <input
                                                id="price_night"
                                                type="number"
                                                min="0"
                                                value={formData.price_per_night}
                                                onChange={e => setFormData({ ...formData, price_per_night: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                                required
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <label htmlFor="price" className="block text-sm font-medium text-brand-dark mb-1">Monthly Rent (₹) *</label>
                                            <input
                                                id="price"
                                                type="number"
                                                min="0"
                                                value={formData.price_per_month}
                                                onChange={e => setFormData({ ...formData, price_per_month: parseFloat(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                                required
                                            />
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-brand-dark mb-1">Location (Address) *</label>
                                <input
                                    id="location"
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="123 Main St, Apt 4B"
                                    className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="city" className="block text-sm font-medium text-brand-dark mb-1">City *</label>
                                <input
                                    id="city"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="New York"
                                    className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Property Details / Room Configuration */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">
                            {['hotel', 'resort'].includes(formData.property_type) ? "Room Configuration" : "Property Details"}
                        </h2>

                        {['hotel', 'resort'].includes(formData.property_type) ? (
                            <div className="space-y-6">
                                {formData.rooms.map((room, index) => (
                                    <div key={index} className="bg-brand-cream/20 p-6 rounded-xl border border-brand-blue/10 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeRoom(index)}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <h3 className="font-bold text-brand-dark mb-4">Room Type {index + 1}</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">Room Name *</label>
                                                <input
                                                    value={room.name}
                                                    onChange={e => updateRoom(index, 'name', e.target.value)}
                                                    placeholder="e.g. Deluxe Suite"
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">Inventory Count *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={room.count}
                                                    onChange={e => updateRoom(index, 'count', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">Bedrooms</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={room.bedrooms}
                                                    onChange={e => updateRoom(index, 'bedrooms', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">Bathrooms</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    value={room.bathrooms}
                                                    onChange={e => updateRoom(index, 'bathrooms', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">Max Guests *</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={room.capacity}
                                                    onChange={e => updateRoom(index, 'capacity', parseInt(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-brand-dark mb-1">
                                                    {formData.rental_type === 'short_term' ? 'Price per Night (₹)' : 'Price per Month (₹)'} *
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.rental_type === 'short_term' ? room.price_per_night : room.price_per_month}
                                                    onChange={e => updateRoom(index, formData.rental_type === 'short_term' ? 'price_per_night' : 'price_per_month', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-brand-blue/20 outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Room Images */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-brand-dark mb-2">Room Images</label>
                                            <div className="flex flex-wrap gap-2">
                                                {room.images.map((img, imgIdx) => (
                                                    <div key={imgIdx} className="relative w-20 h-20">
                                                        <Image src={img} alt="Room" fill className="object-cover rounded-lg" />
                                                    </div>
                                                ))}
                                                <label className="w-20 h-20 flex items-center justify-center border-2 border-dashed border-brand-blue/20 rounded-lg cursor-pointer hover:bg-brand-blue/5">
                                                    <input type="file" multiple accept="image/*" onChange={(e) => handleRoomImageUpload(e, index)} className="hidden" disabled={uploadingRooms[index]} />
                                                    {uploadingRooms[index] ? (
                                                        <Loader2 className="w-6 h-6 text-brand-blue animate-spin" />
                                                    ) : (
                                                        <PlusCircle className="w-6 h-6 text-brand-blue/50" />
                                                    )}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addRoom}
                                    className="w-full py-3 border-2 border-dashed border-brand-blue/30 rounded-xl text-brand-blue font-bold hover:bg-brand-blue/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PlusCircle className="w-5 h-5" />
                                    Add Another Room Type
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {formData.property_type !== 'studio' && (
                                    <div>
                                        <label htmlFor="bedrooms" className="block text-sm font-medium text-brand-dark mb-1">Bedrooms</label>
                                        <input
                                            id="bedrooms"
                                            type="number"
                                            min="0"
                                            value={formData.bedrooms}
                                            onChange={e => setFormData({ ...formData, bedrooms: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="bathrooms" className="block text-sm font-medium text-brand-dark mb-1">Bathrooms</label>
                                    <input
                                        id="bathrooms"
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        value={formData.bathrooms}
                                        onChange={e => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="area" className="block text-sm font-medium text-brand-dark mb-1">Area (sq ft)</label>
                                    <input
                                        id="area"
                                        type="number"
                                        min="0"
                                        value={formData.area_sqft}
                                        onChange={e => setFormData({ ...formData, area_sqft: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Amenities */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">Amenities</h2>
                        <div className="flex gap-2 mb-4">
                            <input
                                value={amenityInput}
                                onChange={e => setAmenityInput(e.target.value)}
                                placeholder="Add amenity (e.g., Parking, Pool)"
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                                className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20 text-brand-dark"
                            />
                            <button type="button" onClick={addAmenity} className="border border-brand-blue/20 rounded-xl bg-white px-4 hover:bg-brand-cream transition-colors">
                                <PlusCircle className="w-5 h-5 text-brand-blue" />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.amenities.map((amenity, idx) => (
                                <span key={idx} className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full flex items-center font-medium text-sm">
                                    {amenity}
                                    <button
                                        type="button"
                                        onClick={() => removeAmenity(idx)}
                                        className="ml-2 hover:text-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Images */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">Property Images</h2>
                        <div className="space-y-4">
                            <div className="border-2 border-dashed border-brand-blue/20 rounded-xl p-8 text-center hover:border-brand-blue/50 transition-colors bg-brand-cream/10">
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
                                        ? <Loader2 className="w-12 h-12 mx-auto mb-4 text-brand-blue animate-spin" />
                                        : <Upload className="w-12 h-12 mx-auto mb-4 text-brand-blue/50" />
                                    }
                                    <p className="text-brand-dark mb-2 font-medium">
                                        {uploading ? "Uploading..." : "Click to upload images"}
                                    </p>
                                    <p className="text-sm text-brand-dark/50">PNG, JPG up to 10MB each</p>
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
                                                className="object-cover rounded-xl"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Governance Checklist */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">Governance & Safety</h2>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="agree_all"
                                    checked={formData.governance?.every(i => i) && formData.governance?.length === 9}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormData(prev => ({
                                            ...prev,
                                            governance: checked ? new Array(9).fill(true) : new Array(9).fill(false)
                                        }));
                                    }}
                                    className="mt-1 h-4 w-4 text-brand-blue rounded border-brand-blue/30 focus:ring-brand-blue"
                                />
                                <label htmlFor="agree_all" className="ml-3 text-sm font-bold text-brand-dark">
                                    I agree to all JustRentIt governance, safety, and legal policies.
                                </label>
                            </div>
                            <hr className="my-2 border-brand-blue/10" />
                            {[
                                "I am the legal owner/authorized representative of this property.",
                                "I confirm all listing details are true and accurate.",
                                "The property complies with government & municipal safety norms.",
                                "I will provide the property in clean and hygienic condition.",
                                "I will not engage in discrimination or illegal eviction practices.",
                                "I follow housing society rules and will disclose all restrictions.",
                                "I will upload real, unedited, and recent property photos.",
                                "I authorize JustRentIt to verify my listing if necessary.",
                                "I understand violation may lead to listing removal or account suspension."
                            ].map((rule, idx) => (
                                <div key={idx} className="flex items-start">
                                    <input
                                        type="checkbox"
                                        id={`rule_${idx}`}
                                        checked={formData.governance?.[idx] || false}
                                        onChange={(e) => {
                                            const newGov = [...(formData.governance || new Array(9).fill(false))];
                                            newGov[idx] = e.target.checked;
                                            setFormData(prev => ({ ...prev, governance: newGov }));
                                        }}
                                        className="mt-1 h-4 w-4 text-brand-blue rounded border-brand-blue/30 focus:ring-brand-blue"
                                    />
                                    <label htmlFor={`rule_${idx}`} className="ml-3 text-sm text-brand-dark/70">
                                        {rule}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={() => resetForm(true)}
                            className="px-6 border border-brand-blue/20 rounded-xl py-3 bg-white text-brand-dark/70 font-medium hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                resetForm(false); // Clear without confirmation if they are cancelling out
                                router.push("/dashboard");
                            }}
                            className="flex-1 border border-brand-blue/20 rounded-xl py-3 bg-white text-brand-dark font-medium hover:bg-brand-cream transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-brand-blue hover:bg-brand-blue/90 h-12 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01]"
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
            </div>
        </div>
    );
}
