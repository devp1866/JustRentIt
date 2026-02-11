

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, MapPin, IndianRupee, Trash2, Building2, Edit } from "lucide-react";

import Image from "next/image";

export default function MyProperties({ user }) {
  const queryClient = useQueryClient();

  const { data: properties = [], isLoading, isError, error } = useQuery({
    queryKey: ['my-properties'],
    queryFn: async () => {
      const res = await fetch('/api/user/properties');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to fetch properties');
      }
      return res.json();
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete property');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });

  const handleDelete = (property) => {
    if (window.confirm(`Are you sure you want to delete "${property.title}"?`)) {
      deletePropertyMutation.mutate(property._id);
    }
  };

  const [filterType, setFilterType] = React.useState("all");

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ id, currentStatus }) => {
      const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
      const res = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-properties'] });
    },
  });

  const filteredProperties = properties.filter(property => {
    if (filterType === "all") return true;
    return property.rental_type === filterType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-brand-dark">
          My Properties ({filteredProperties.length})
        </h2>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-brand-blue/20 rounded-xl px-4 py-2 text-sm bg-white text-brand-dark focus:ring-2 focus:ring-brand-blue/50 outline-none"
          >
            <option value="all">All Types</option>
            <option value="long_term">Long Term</option>
            <option value="short_term">Short Term</option>
          </select>
          <Link href="/add-property">
            <button className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl gap-2 px-4 py-2 flex items-center text-sm font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-105">
              <PlusCircle className="w-4 h-4" />
              Add New Property
            </button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-brand-blue/10">
              <div className="h-48 w-full rounded-lg mb-4 bg-brand-cream/50 animate-pulse" />
              <div className="h-6 w-3/4 mb-2 bg-brand-cream/50 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-brand-cream/50 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 rounded-2xl shadow-md p-12 text-center border border-red-100">
          <h3 className="text-xl font-semibold text-red-900 mb-2">Error loading properties</h3>
          <p className="text-red-600 mb-6">{error?.message || "Something went wrong"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-900 hover:bg-red-800 text-white rounded-xl px-6 py-2 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center border border-brand-blue/10">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-brand-dark/20" />
          <h3 className="text-xl font-bold text-brand-dark mb-2">No properties listed yet</h3>
          <p className="text-brand-dark/60 mb-6">Start by adding your first property</p>
          <Link href="/add-property">
            <button className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-xl gap-2 px-6 py-3 flex items-center justify-center mx-auto font-bold shadow-lg shadow-brand-blue/20 transition-all hover:scale-105">
              <PlusCircle className="w-4 h-4 mr-2" />
              List Your First Property
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProperties.map((property) => (
            <div key={property._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all border border-brand-blue/10 group">
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"}
                  alt={property.title}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`
                    px-3 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wide shadow-sm
                    ${property.status === "available" ? "bg-brand-green" : property.status === "rented" ? "bg-brand-blue" : "bg-gray-600"}
                    `}>
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4">

                  <span className="px-3 py-1 rounded-full bg-brand-dark/90 text-white text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-sm">
                    {property.property_type}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-brand-dark mb-2 truncate">{property.title}</h3>
                <div className="flex items-center text-brand-dark/70 mb-4">
                  <MapPin className="w-4 h-4 mr-1 text-brand-blue" />
                  <span className="text-sm truncate">{property.location}</span>
                </div>

                <div className="mb-4 text-xs text-brand-dark/50 space-y-1">
                  <p>Posted: {new Date(property.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(property.updatedAt).toLocaleDateString()}</p>
                </div>

                <div className="flex items-center justify-between mb-6 p-3 bg-brand-cream/30 rounded-xl border border-brand-blue/5">
                  <div className="flex items-center text-brand-blue font-bold">
                    <IndianRupee className="w-4 h-4" />
                    <span>
                      {property.rental_type === 'short_term'
                        ? `${property.price_per_night}/night`
                        : `${property.price_per_month}/mo`
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => toggleAvailabilityMutation.mutate({ id: property._id, currentStatus: property.status })}
                    disabled={property.status === 'rented'}
                    className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${property.status === 'available'
                      ? 'border-brand-green/30 text-brand-green hover:bg-brand-green/10'
                      : property.status === 'rented'
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-gray-400 text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {property.status === 'available' ? 'Mark Unavailable' : property.status === 'rented' ? 'Rented' : 'Mark Available'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <Link href={`/property-details/${property._id}`} className="flex-1">
                    <button className="w-full border border-brand-blue/20 hover:border-brand-blue hover:bg-brand-blue hover:text-white text-brand-dark/70 font-semibold rounded-xl px-4 py-2 transition-all">
                      View
                    </button>
                  </Link>
                  <Link href={`/edit-property/${property._id}`}>
                    <button
                      className="border border-brand-blue/20 hover:border-brand-blue hover:text-brand-blue text-brand-dark/50 rounded-xl px-3 py-2 transition-all"
                      title="Edit"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(property)}
                    className="border border-brand-blue/20 hover:border-red-600 hover:text-red-600 text-brand-dark/50 rounded-xl px-3 py-2 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
