import React from "react";
import Link from "next/link";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import Image from "next/image";

export default function PropertyCard({ property }) {
  const mainImage =
    property.images?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800";

  return (
    <Link href={`/property-details/${property._id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-brand-blue/10 hover:border-brand-blue/20">
        <div className="relative h-56 overflow-hidden">
          <Image
            src={mainImage}
            width={800}
            height={600}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            <span className="bg-white/90 backdrop-blur-sm text-brand-dark font-bold px-3 py-1 rounded-xl shadow-sm border border-brand-blue/10">
              {property.rental_type === 'short_term'
                ? `₹${property.price_per_night}/night`
                : `₹${property.price_per_month}/mo`
              }
            </span>
            <span className={`px-2 py-1 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm ${property.rental_type === 'short_term' ? 'bg-brand-purple/90 text-white' : 'bg-brand-blue/90 text-white'
              }`}>
              {property.rental_type === 'short_term' ? 'Short Term' : 'Long Term'}
            </span>
            {property.offer && property.offer.enabled && (
              <span className="bg-brand-green/90 backdrop-blur-sm text-white px-2 py-1 rounded-xl text-xs font-bold uppercase tracking-wide shadow-sm">
                {property.offer.discount_percentage}% OFF
              </span>
            )}
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-brand-dark mb-2 group-hover:text-brand-blue transition-colors truncate">
            {property.title}
          </h3>
          <div className="flex items-center text-brand-dark/70 mb-4">
            <MapPin className="w-4 h-4 mr-1 text-brand-blue" />
            <span className="text-sm truncate">{property.location}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-brand-dark/60">
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="w-4 h-4 text-brand-blue" />
                <span>{property.bedrooms} Bed</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="w-4 h-4 text-brand-blue" />
                <span>{property.bathrooms} Bath</span>
              </div>
            )}
            {property.area_sqft && (
              <div className="flex items-center gap-1">
                <Square className="w-4 h-4 text-brand-blue" />
                <span>{property.area_sqft} sqft</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
