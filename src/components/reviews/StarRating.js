import { Star, StarHalf } from "lucide-react";

export default function StarRating({ rating, setRating, interactive = false, size = "md", showCount = false, count = 0 }) {
    const stars = [1, 2, 3, 4, 5];

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8"
    };

    const handleRating = (star) => {
        if (interactive && setRating) {
            setRating(star);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {stars.map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => handleRating(star)}
                    className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} focus:outline-none`}
                    disabled={!interactive}
                >
                    <Star
                        className={`${sizeClasses[size]} ${star <= rating
                                ? "text-brand-yellow fill-brand-yellow"
                                : "text-gray-300 fill-gray-100" // Unfilled style
                            } transition-colors duration-200`}
                    />
                </button>
            ))}
            {showCount && (
                <span className="ml-2 text-sm text-brand-dark/60 font-medium">
                    {rating ? rating.toFixed(1) : "0.0"} <span className="text-xs">({count})</span>
                </span>
            )}
        </div>
    );
}
