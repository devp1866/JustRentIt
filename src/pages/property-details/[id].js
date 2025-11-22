import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  MapPin,
  Bed,
  Bath,
  Square,
  CheckCircle,
  Calendar,
  Info,
  Home,
  Shield,
  Star
} from "lucide-react";
import BookingModal from "../../components/property/BookingModal";

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetch(`/api/properties/${id}`)
        .then(res => {
          if (!res.ok) throw new Error("Failed to fetch property details");
          return res.json();
        })
        .then(data => {
          setProperty(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.message);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h1>
        <p className="text-gray-600 mb-4">{error || "The property you are looking for does not exist."}</p>
        <button
          onClick={() => router.push('/properties')}
          className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
        >
          Browse Properties
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Breadcrumb & Header */}
            <div>
              <button
                onClick={() => router.back()}
                className="text-gray-500 hover:text-blue-900 mb-4 flex items-center text-sm font-medium"
              >
                ← Back to Properties
              </button>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${property.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {property.status}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wide">
                      {property.property_type}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-2 text-blue-900" />
                    <span className="text-lg">{property.location}, {property.city}</span>
                  </div>
                </div>
                {/* Price is shown in booking card, hiding here for cleaner layout on desktop */}
                <div className="text-left md:text-right lg:hidden">
                  <p className="text-3xl font-bold text-blue-900">${property.price_per_month}</p>
                  <p className="text-gray-500">per month</p>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="relative h-[400px] md:h-[500px] w-full">
                {property.images && property.images.length > 0 ? (
                  <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                    <Home className="w-20 h-20" />
                  </div>
                )}
              </div>
              {/* Thumbnail Grid (if more images existed) */}
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-2 bg-gray-100">
                  {property.images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="relative h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-90">
                      <Image src={img} alt={`View ${idx + 2}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Property Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <Bed className="w-8 h-8 text-blue-900 mb-2" />
                  <span className="font-bold text-lg text-gray-900">{property.bedrooms || 0}</span>
                  <span className="text-sm text-gray-500">Bedrooms</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <Bath className="w-8 h-8 text-blue-900 mb-2" />
                  <span className="font-bold text-lg text-gray-900">{property.bathrooms || 0}</span>
                  <span className="text-sm text-gray-500">Bathrooms</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <Square className="w-8 h-8 text-blue-900 mb-2" />
                  <span className="font-bold text-lg text-gray-900">{property.area_sqft || 0}</span>
                  <span className="text-sm text-gray-500">Sq Ft</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
                  <Home className="w-8 h-8 text-blue-900 mb-2" />
                  <span className="font-bold text-lg text-gray-900 capitalize">{property.property_type}</span>
                  <span className="text-sm text-gray-500">Type</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {property.description || "No description available for this property."}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Amenities</h2>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-gray-700">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No specific amenities listed.</p>
              )}
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-gray-100">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">Monthly Rent</p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-blue-900">${property.price_per_month}</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <Calendar className="w-4 h-4 mr-2 text-blue-900" />
                  <span>Available Now</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 mr-2 text-blue-900" />
                  <span>Verified Listing</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!session) {
                    router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
                  } else {
                    setShowBookingModal(true);
                  }
                }}
                disabled={property.status !== 'available'}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${property.status === 'available'
                  ? 'bg-blue-900 text-white hover:bg-blue-800 shadow-lg hover:shadow-blue-900/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {property.status === 'available' ? 'Book Now' : 'Not Available'}
              </button>

              <p className="text-xs text-center text-gray-400 mt-4">
                You won&apos;t be charged yet
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          property={property}
          user={session?.user || { email: 'guest@example.com', full_name: 'Guest User' }}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
}
