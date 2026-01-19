import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import StarRating from "./StarRating";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function ReviewModal({ booking, onClose, initialData = null }) {
    // 1. Determine Property Group
    // Group A (Serviced): Hotel, Resort, Villa
    const isGroupA = ["hotel", "resort", "villa"].includes(booking.property_type?.toLowerCase());

    const initialCategories = initialData?.categories || {
        cleanliness: 0,
        safety: 0,
        maintenance: 0,
        communication: 0,
        accuracy: 0,
        location: 0,
        value: 0,
        amenities: 0,
        check_in: 0,
        service_staff: 0
    };

    const [categories, setCategories] = useState(initialCategories);
    const [comment, setComment] = useState(initialData?.comment || "");
    const [error, setError] = useState("");

    // Calculated locally for display
    const [calculatedRating, setCalculatedRating] = useState(initialData?.rating || 0);

    const isEditing = !!initialData;
    const queryClient = useQueryClient();

    // 2. Define Weights & Justification
    const weights = isGroupA ? {
        cleanliness: 0.20,
        safety: 0.15,
        service_staff: 0.15,
        amenities: 0.10,
        accuracy: 0.10,
        value: 0.10,
        communication: 0.10,
        location: 0.05,
        maintenance: 0.05
    } : {
        cleanliness: 0.20,
        safety: 0.15,
        maintenance: 0.15,
        amenities: 0.10,
        accuracy: 0.10,
        value: 0.10,
        communication: 0.10,
        location: 0.05,
        check_in: 0.05
    };

    const justifications = {
        cleanliness: "Hygiene and sanitation standards.",
        safety: "Security measures and neighborhood safety.",
        service_staff: "Professionalism and behavior of staff.",
        maintenance: "Condition of appliances, furniture, and plumbing.",
        amenities: "Quality of WiFi, AC, kitchen, etc.",
        accuracy: "Did reality match the listing description?",
        value: "Was the experience worth the price?",
        communication: "Host responsiveness and helpfulness.",
        location: "Accessibility and neighborhood vibe.",
        check_in: "Ease of gaining access/key handover."
    };

    // Filter active categories based on weights
    const activeCategories = Object.keys(weights);

    // Initial calculation on load (for edit mode)
    useEffect(() => {
        calculateRating(categories);
    }, []);

    const calculateRating = (cats) => {
        let totalScore = 0;
        let totalWeight = 0;

        for (const [key, weight] of Object.entries(weights)) {
            if (cats[key] > 0) {
                totalScore += cats[key] * weight;
                totalWeight += weight;
            }
        }

        const newRating = totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : 0;
        setCalculatedRating(newRating);
    };

    // 3. Handle Changes & Recalculate
    const handleCategoryChange = (category, value) => {
        const newCategories = { ...categories, [category]: value };
        setCategories(newCategories);
        calculateRating(newCategories);
    };

    const submitReviewMutation = useMutation({
        mutationFn: async (data) => {
            const url = isEditing ? '/api/reviews/update' : '/api/reviews/create';
            const method = isEditing ? 'PUT' : 'POST';

            const payload = isEditing ? { review_id: initialData._id, ...data } : { booking_id: booking._id, ...data };

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to submit review');
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['my-bookings']);
            queryClient.invalidateQueries(['property', booking.property_id]);
            onClose(true);
        },
        onError: (err) => {
            setError(err.message);
        }
    });

    const handleSubmit = () => {
        setError("");

        // Validate all ACTIVE categories are rated
        const missedCategories = activeCategories.filter(cat => categories[cat] === 0);
        if (missedCategories.length > 0) {
            return setError(`Please rate all categories. Missing: ${missedCategories.map(c => c.replace('_', ' ')).join(', ')}`);
        }

        if (comment.length < 10) return setError("Please write a review of at least 10 characters.");

        submitReviewMutation.mutate({
            categories,
            comment
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-brand-blue/10 bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-brand-dark">
                            {isEditing ? "Edit Review" : "Rate Your Stay"}
                        </h2>
                        <p className="text-brand-dark/60 text-sm mt-1">
                            {booking.property_title} • <span className="font-semibold text-brand-blue">{isGroupA ? "Serviced Stay" : "Private Rental"}</span>
                        </p>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-brand-dark/50 font-bold uppercase tracking-wider mb-1">Overall Score</p>
                        <div className="flex items-end justify-end gap-2">
                            <span className="text-3xl font-black text-brand-blue leading-none">{calculatedRating}</span>
                            <span className="text-sm text-brand-dark/40 font-medium mb-1">/ 5.0</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 text-sm animate-in slide-in-from-top-2 border border-red-100">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <p className="font-medium">{error}</p>
                        </div>
                    )}

                    {/* Mobile Overall Score Score */}
                    <div className="sm:hidden mb-6 flex items-center justify-between bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10">
                        <span className="font-bold text-brand-dark">Overall Score</span>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-brand-blue leading-none">{calculatedRating}</span>
                            <span className="text-sm text-brand-dark/40 font-medium">/ 5.0</span>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Categories Grid */}
                        <div>
                            <h3 className="text-sm font-bold text-brand-dark/40 uppercase tracking-widest mb-4">Detailed Ratings</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                {activeCategories.map((category) => (
                                    <div key={category} className="group">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-sm font-bold text-brand-dark capitalize">
                                                {category.replace('_', ' ')}
                                            </label>
                                            <StarRating
                                                rating={categories[category]}
                                                setRating={(val) => handleCategoryChange(category, val)}
                                                interactive={true}
                                                size="md"
                                            />
                                        </div>
                                        <p className="text-xs text-brand-dark/50 italic group-hover:text-brand-dark/70 transition-colors">
                                            {justifications[category]}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Comment Section */}
                        <div className="border-t border-brand-blue/10 pt-6">
                            <h3 className="text-sm font-bold text-brand-dark/40 uppercase tracking-widest mb-4">Your Feedback</h3>
                            <div className="relative">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full px-4 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none h-32 resize-none bg-gray-50 focus:bg-white transition-colors placeholder:text-brand-dark/30 text-sm"
                                    placeholder="What did you love? What could be improved?"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-brand-dark/40 font-medium bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
                                    {comment.length} chars
                                </div>
                            </div>
                            <p className="text-xs text-brand-dark/40 mt-2 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Minimum 10 characters required
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-brand-blue/10 bg-gray-50 flex gap-3 justify-end">
                    <button
                        onClick={() => onClose(false)}
                        className="px-6 py-2.5 rounded-xl font-bold text-brand-dark/60 hover:text-brand-dark hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitReviewMutation.isPending}
                        className="px-8 py-2.5 rounded-xl font-bold bg-brand-dark text-white hover:bg-brand-blue shadow-lg hover:shadow-brand-blue/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitReviewMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {isEditing ? "Updating..." : "Submitting..."}
                            </>
                        ) : (
                            isEditing ? "Update Review" : "Submit Review"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
