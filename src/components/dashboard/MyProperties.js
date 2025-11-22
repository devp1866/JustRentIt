// components/dashboard/MyProperties.js

import React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, MapPin, DollarSign, Trash2, Building2, Edit } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          My Properties ({properties.length})
        </h2>
        <Link href="/add-property">
          <button className="bg-blue-900 hover:bg-blue-800 text-white rounded gap-2 px-4 py-2 flex items-center">
            <PlusCircle className="w-4 h-4" />
            Add New Property
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-6">
              <div className="h-48 w-full rounded-lg mb-4 bg-gray-200 animate-pulse" />
              <div className="h-6 w-3/4 mb-2 bg-gray-200 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 rounded-2xl shadow-md p-12 text-center">
          <h3 className="text-xl font-semibold text-red-900 mb-2">Error loading properties</h3>
          <p className="text-red-600 mb-6">{error?.message || "Something went wrong"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-900 hover:bg-red-800 text-white rounded px-4 py-2"
          >
            Retry
          </button>
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties listed yet</h3>
          <p className="text-gray-600 mb-6">Start by adding your first property</p>
          <Link href="/add-property">
            <button className="bg-blue-900 hover:bg-blue-800 text-white rounded gap-2 px-4 py-2 flex items-center justify-center mx-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              List Your First Property
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {properties.map((property) => (
            <div key={property._id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"}
                  alt={property.title}
                  width={800}
                  height={600}
                  className="w-full h-full object-cover"
                />
                <span className={`
                  absolute top-4 right-4 px-3 py-1 rounded text-white font-semibold 
                  ${property.status === "available" ? "bg-green-600" : property.status === "rented" ? "bg-blue-600" : "bg-gray-600"}
                `}>
                  {property.status}
                </span>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{property.title}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
                </div>
                <div className="flex items-center text-blue-900 font-semibold mb-4">
                  <DollarSign className="w-5 h-5" />
                  <span>{property.price_per_month}/month</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/property-details/${property._id}`} className="flex-1">
                    <button className="w-full border rounded bg-white px-4 py-2">
                      View Details
                    </button>
                  </Link>
                  <Link href={`/edit-property/${property._id}`} className="mr-2">
                    <button
                      className="border rounded px-4 py-2 text-blue-600 hover:text-blue-700"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(property)}
                    className="border rounded px-4 py-2 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
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
