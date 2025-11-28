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
        if (formData.rental_type === 'short_term' && !formData.price_per_night) {
            alert("Please enter nightly price");
            return;
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
                                        <option value="pg">PG</option>
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

                    {/* Property Details */}
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-brand-blue/10">
                        <h2 className="text-xl font-bold text-brand-dark mb-6">Property Details</h2>
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
                            onClick={() => router.push("/dashboard")}
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
