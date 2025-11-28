import Image from "next/image";
import Head from "next/head";
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
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { isSameDay, parseISO } from 'date-fns';

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);

  // Gallery State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openGallery = (index) => {
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

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

      // Fetch availability
      fetch(`/api/properties/${id}/availability`)
        .then(res => res.json())
        .then(data => {
          const dates = [];
          data.forEach(booking => {
            let currentDate = parseISO(booking.start_date);
            const endDate = booking.end_date ? parseISO(booking.end_date) : parseISO(booking.start_date); // Fallback if end_date missing

            while (currentDate <= endDate) {
              dates.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
          setBookedDates(dates);
        })
        .catch(console.error);
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
    <div className="min-h-screen bg-brand-cream py-8">
      <Head>
        <title>{property.title} | JustRentIt</title>
        <meta name="description" content={`Rent this ${property.property_type} in ${property.city}. ${property.description?.slice(0, 150)}...`} />
        <meta property="og:title" content={property.title} />
        <meta property="og:description" content={`Rent this ${property.property_type} in ${property.city}.`} />
        <meta property="og:image" content={property.images?.[0] || ""} />
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Images & Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Breadcrumb & Header */}
            <div>
              <button
                onClick={() => router.back()}
                className="text-brand-dark/50 hover:text-brand-blue mb-4 flex items-center text-sm font-medium transition-colors"
              >
                ← Back to Properties
              </button>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${property.status === 'available' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-100 text-red-800'
                      }`}>
                      {property.status}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold uppercase tracking-wide">
                      {property.property_type}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-brand-yellow/10 text-brand-yellow text-xs font-bold uppercase tracking-wide">
                      {property.rental_type === 'short_term' ? 'Short Term' : 'Long Term'}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-brand-dark mb-2">{property.title}</h1>
                  <div className="flex items-center text-brand-dark/70">
                    <MapPin className="w-5 h-5 mr-2 text-brand-blue" />
                    <span className="text-lg">{property.location}, {property.city}</span>
                  </div>
                  {/* Price is shown in booking card, hiding here for cleaner layout on desktop */}
                  <div className="text-left md:text-right lg:hidden">
                    <p className="text-3xl font-bold text-brand-blue">
                      {property.rental_type === 'short_term'
                        ? `₹${property.price_per_night}`
                        : `₹${property.price_per_month}`
                      }
                    </p>
                    <p className="text-brand-dark/50">
                      {property.rental_type === 'short_term' ? 'per night' : 'per month'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-blue/10">
              <div
                className="relative h-[400px] md:h-[500px] w-full cursor-pointer group"
                onClick={() => openGallery(0)}
              >
                {property.images && property.images.length > 0 ? (
                  <>
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                      <span className="text-white opacity-0 group-hover:opacity-100 font-semibold bg-black bg-opacity-50 px-4 py-2 rounded-full transition-opacity">
                        View All Photos
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-brand-cream flex items-center justify-center text-brand-dark/30">
                    <Home className="w-20 h-20" />
                  </div>
                )}
              </div>
              {/* Thumbnail Grid (if more images existed) */}
              {property.images && property.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 p-2 bg-brand-cream/50">
                  {property.images.slice(1, 5).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-90"
                      onClick={() => openGallery(idx + 1)}
                    >
                      <Image src={img} alt={`View ${idx + 2}`} fill className="object-cover" />
                      {idx === 3 && property.images.length > 5 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold text-lg">
                          +{property.images.length - 5}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
              <h2 className="text-xl font-bold text-brand-dark mb-6">Property Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center p-4 bg-brand-cream rounded-xl">
                  <Bed className="w-8 h-8 text-brand-blue mb-2" />
                  <span className="font-bold text-lg text-brand-dark">{property.bedrooms || 0}</span>
                  <span className="text-sm text-brand-dark/50">Bedrooms</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-brand-cream rounded-xl">
                  <Bath className="w-8 h-8 text-brand-blue mb-2" />
                  <span className="font-bold text-lg text-brand-dark">{property.bathrooms || 0}</span>
                  <span className="text-sm text-brand-dark/50">Bathrooms</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-brand-cream rounded-xl">
                  <Square className="w-8 h-8 text-brand-blue mb-2" />
                  <span className="font-bold text-lg text-brand-dark">{property.area_sqft || 0}</span>
                  <span className="text-sm text-brand-dark/50">Sq Ft</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-brand-cream rounded-xl">
                  <Home className="w-8 h-8 text-brand-blue mb-2" />
                  <span className="font-bold text-lg text-brand-dark capitalize">{property.property_type}</span>
                  <span className="text-sm text-brand-dark/50">Type</span>
                </div>
              </div>
            </div>

            {/* Special Offer */}
            {property.offer?.enabled && (
              <div className="bg-gradient-to-r from-brand-blue to-brand-blue/80 rounded-2xl shadow-sm p-6 md:p-8 text-white">
                <div className="flex items-start gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Star className="w-8 h-8 text-brand-yellow fill-current" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-2">Special Offer!</h2>
                    <p className="text-blue-100 text-lg">
                      Get <span className="font-bold text-white">{property.offer.discount_percentage}% OFF</span> when you book for {property.offer.required_duration} {property.rental_type === 'short_term' ? 'days' : 'months'} or more!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Calendar */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
              <h2 className="text-xl font-bold text-brand-dark mb-6">Availability</h2>
              <div className="flex justify-center">
                <DayPicker
                  mode="default"
                  disabled={bookedDates}
                  modifiers={{ booked: bookedDates }}
                  modifiersStyles={{ booked: { color: 'red', textDecoration: 'line-through' } }}
                />
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
              <h2 className="text-xl font-bold text-brand-dark mb-4">Description</h2>
              <p className="text-brand-dark/70 leading-relaxed whitespace-pre-line">
                {property.description || "No description available for this property."}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
              <h2 className="text-xl font-bold text-brand-dark mb-6">Amenities</h2>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center text-brand-dark/80">
                      <CheckCircle className="w-5 h-5 text-brand-green mr-3 flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-brand-dark/50 italic">No specific amenities listed.</p>
              )}
            </div>
          </div>

          {/* Right Column: Booking Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24 border border-brand-blue/10">
              <div className="mb-6">
                <p className="text-sm text-brand-dark/50 mb-1">
                  {property.rental_type === 'short_term' ? 'Nightly Price' : 'Monthly Rent'}
                </p>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-brand-blue">
                    {property.rental_type === 'short_term'
                      ? `₹${property.price_per_night}`
                      : `₹${property.price_per_month}`
                    }
                  </span>
                  <span className="text-brand-dark/50 ml-1">
                    {property.rental_type === 'short_term' ? '/night' : '/mo'}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-sm text-brand-dark/70 bg-brand-cream p-3 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2 text-brand-blue" />
                  <span>Available Now</span>
                </div>
                <div className="flex items-center text-sm text-brand-dark/70 bg-brand-cream p-3 rounded-xl">
                  <Shield className="w-4 h-4 mr-2 text-brand-blue" />
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
                  ? 'bg-brand-blue text-white hover:bg-brand-blue/90 shadow-lg hover:shadow-brand-blue/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {property.status === 'available' ? 'Book Now' : 'Not Available'}
              </button>

              <p className="text-xs text-center text-brand-dark/40 mt-4">
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
          bookedDates={bookedDates}
        />
      )}

      {/* Image Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center" onClick={closeGallery}>
          <button
            onClick={closeGallery}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50 p-2"
          >
            <span className="text-4xl">&times;</span>
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <span className="text-2xl">&#10094;</span>
          </button>

          <div className="relative w-full h-full max-w-5xl max-h-[80vh] mx-4" onClick={e => e.stopPropagation()}>
            <Image
              src={property.images[currentImageIndex]}
              alt={`Gallery Image ${currentImageIndex + 1}`}
              fill
              className="object-contain"
            />
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {property.images.length}
            </div>
          </div>

          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <span className="text-2xl">&#10095;</span>
          </button>
        </div>
      )}
    </div>
  );
}
