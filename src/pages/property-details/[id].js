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
  Star,
  Users
} from "lucide-react";
import BookingModal from "../../components/property/BookingModal";
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { isSameDay, parseISO } from 'date-fns';
import StarRating from "../../components/reviews/StarRating";
import SEO from "../../components/SEO";

export default function PropertyDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Gallery State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);

  // Multi-Room State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [priceFilter, setPriceFilter] = useState('all'); // 'all', 'under_5k', '5k_10k', 'above_10k'

  const openGallery = (index, images = null) => {
    // If specific images provided (e.g., room images), use them. Otherwise use property images.
    setGalleryImages(images || property.images || []);
    setCurrentImageIndex(index);
    setIsGalleryOpen(true);
  };

  const closeGallery = () => setIsGalleryOpen(false);

  const nextImage = (e) => {
    e.stopPropagation();
    if (!galleryImages.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (!galleryImages.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (id) {
      // Fetch Property
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

      // Fetch Reviews
      fetch(`/api/properties/${id}/reviews`)
        .then(res => res.json())
        .then(setReviews)
        .catch(console.error);
    }
  }, [id]);

  // Separate Effect for Availability (Re-run when room selection changes)
  useEffect(() => {
    if (!property) return;

    const fetchAvailability = async () => {
      try {
        // If multi-room (hotel/resort) and no room selected, DO NOT show any booked dates
        // because the user hasn't chosen what to check availability for yet.
        const isMultiRoom = ['hotel', 'resort', 'villa'].includes(property.property_type?.toLowerCase());
        if (isMultiRoom && !selectedRoom) {
          setBookedDates([]);
          return;
        }

        const queryParams = new URLSearchParams();
        if (selectedRoom?._id) {
          queryParams.append('room_id', selectedRoom._id);
        }

        // Use booked-dates endpoint for consistent logic
        const res = await fetch(`/api/properties/${id}/booked-dates?${queryParams.toString()}`);
        if (res.ok) {
          const { bookings } = await res.json();
          const dates = [];
          // Handle both array of dates directly or array of booking objects ranges
          // The booked-dates API returns { start_date, end_date } objects inside a 'bookings' key
          (bookings || []).forEach(booking => {
            let currentDate = parseISO(booking.start_date);
            const endDate = booking.end_date ? parseISO(booking.end_date) : parseISO(booking.start_date);
            // Add one day to end date logic if needed, but assuming [start, end) or inclusive?
            // Usually booking is checkout on end_date, so occupied until end_date - 1. 
            // Let's stick to standard logic: range is inclusive of start, exclusive of end for "nights" 
            // BUT for display "booked", we usually want to block the night.
            // Let's assume data is correct ranges.

            // Simple loop:
            while (currentDate < endDate) {
              dates.push(new Date(currentDate));
              currentDate.setDate(currentDate.getDate() + 1);
            }
          });
          setBookedDates(dates);
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      }
    };

    fetchAvailability();
  }, [property, selectedRoom, id]);

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
      <SEO
        title={property.title}
        description={`Rent this ${property.property_type} in ${property.city}. ${property.description?.slice(0, 150)}...`}
        image={property.images?.[0]}
      />
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
                  <div className="flex flex-wrap items-center gap-4 text-brand-dark/70 mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 mr-1 text-brand-blue" />
                      <span className="text-lg">{property.location}, {property.city}</span>
                    </div>
                    {property.rating > 0 && (
                      <div className="flex items-center bg-brand-yellow/10 px-2 py-1 rounded-lg">
                        <StarRating rating={property.rating} size="sm" />
                        <span className="ml-2 font-bold text-brand-dark">{property.rating}</span>
                        <span className="ml-1 text-sm text-brand-dark/50">({property.review_count} reviews)</span>
                      </div>
                    )}
                  </div>
                  {/* Price is shown in booking card, hiding here for cleaner layout on desktop */}
                  <div className="text-left md:text-right lg:hidden">
                    {property.rooms && property.rooms.length > 0 ? (
                      (() => {
                        const prices = property.rooms.map(r => property.rental_type === 'short_term' ? r.price_per_night : r.price_per_month).filter(p => p !== undefined && p !== null && p > 0);
                        if (prices.length > 0) {
                          const minPrice = Math.min(...prices);
                          return (
                            <>
                              <p className="text-3xl font-bold text-brand-blue">₹{minPrice}</p>
                              <p className="text-brand-dark/50">Starts from</p>
                            </>
                          )
                        }
                        return <span className="text-3xl font-bold text-brand-blue">N/A</span>
                      })()
                    ) : (
                      <>
                        <p className="text-3xl font-bold text-brand-blue">
                          {property.rental_type === 'short_term'
                            ? `₹${property.price_per_night}`
                            : `₹${property.price_per_month}`
                          }
                        </p>
                        <p className="text-brand-dark/50">
                          {property.rental_type === 'short_term' ? 'per night' : 'per month'}
                        </p>
                      </>
                    )}
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

            {/* Room Selection for Multi-Room Properties */}
            {property.rooms && property.rooms.length > 0 && (
              <div id="room-selection" className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                  <h2 className="text-xl font-bold text-brand-dark">Choose Your Room</h2>

                  {/* Price Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-dark/70">Filter by Price:</span>
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-brand-blue/20 text-sm focus:ring-2 focus:ring-brand-blue/50 outline-none"
                    >
                      <option value="all">All Prices</option>
                      <option value="under_5k">Under ₹5,000</option>
                      <option value="5k_10k">₹5,000 - ₹10,000</option>
                      <option value="above_10k">Above ₹10,000</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {property.rooms
                    .filter(room => {
                      const price = property.rental_type === 'short_term' ? room.price_per_night : room.price_per_month;
                      if (!price) return true;
                      if (priceFilter === 'under_5k') return price < 5000;
                      if (priceFilter === '5k_10k') return price >= 5000 && price <= 10000;
                      if (priceFilter === 'above_10k') return price > 10000;
                      return true;
                    })
                    .map((room) => (
                      <div
                        key={room._id}
                        className={`border rounded-xl p-4 transition-all cursor-pointer ${selectedRoom?._id === room._id
                          ? 'border-brand-blue bg-brand-blue/5 shadow-md ring-1 ring-brand-blue'
                          : 'border-gray-200 hover:border-brand-blue/50'
                          }`}
                        onClick={() => setSelectedRoom(room)}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Room Image Section */}
                          <div className="flex-shrink-0 w-full md:w-72">
                            <div
                              className="relative h-48 rounded-xl overflow-hidden bg-gray-100 cursor-pointer group"
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selecting room when viewing photos
                                openGallery(0, room.images);
                              }}
                            >
                              {room.images && room.images.length > 0 ? (
                                <>
                                  <Image
                                    src={room.images[0]}
                                    alt={room.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                    <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-opacity">View Photos</span>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <Home className="w-10 h-10" />
                                </div>
                              )}
                            </div>

                            {/* Room Image Thumbnails */}
                            {room.images && room.images.length > 1 && (
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                {room.images.slice(1, 5).map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative h-14 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 border border-gray-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openGallery(idx + 1, room.images);
                                    }}
                                  >
                                    <Image src={img} alt={`Room view ${idx + 2}`} fill className="object-cover" />
                                    {idx === 3 && room.images.length > 5 && (
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                                        +{room.images.length - 5}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Room Details */}
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-bold text-brand-dark">{room.name}</h3>
                                <div className="flex flex-wrap gap-3 text-sm text-brand-dark/70 mt-2 mb-3">
                                  <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                                    <Users className="w-4 h-4 mr-2 text-brand-blue" />
                                    <span>Max {room.capacity} Guests</span>
                                  </div>
                                  {room.bedrooms > 0 && (
                                    <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                                      <Bed className="w-4 h-4 mr-2 text-brand-blue" />
                                      <span>{room.bedrooms} Bed{room.bedrooms > 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                  {room.bathrooms > 0 && (
                                    <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                                      <Bath className="w-4 h-4 mr-2 text-brand-blue" />
                                      <span>{room.bathrooms} Bath{room.bathrooms > 1 ? 's' : ''}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                                    <Home className="w-4 h-4 mr-2 text-brand-blue" />
                                    <span>{room.count} Units</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-brand-blue">
                                  {property.rental_type === 'short_term'
                                    ? `₹${room.price_per_night}`
                                    : `₹${room.price_per_month}`
                                  }
                                </p>
                                <p className="text-xs text-brand-dark/50">
                                  {property.rental_type === 'short_term' ? '/night' : '/mo'}
                                </p>
                              </div>
                            </div>

                            {/* Amenities */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {room.amenities && room.amenities.slice(0, 3).map((am, idx) => (
                                <span key={idx} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-full text-gray-600">
                                  {am}
                                </span>
                              ))}
                              {room.amenities && room.amenities.length > 3 && (
                                <span className="text-xs text-brand-blue font-medium pt-1">+{room.amenities.length - 3} more</span>
                              )}
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          <div className="flex items-center justify-center md:justify-end">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedRoom?._id === room._id ? 'border-brand-blue bg-brand-blue' : 'border-gray-300'
                              }`}>
                              {selectedRoom?._id === room._id && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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

            {/* Reviews Section */}
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 border border-brand-blue/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-brand-dark">Guest Reviews</h2>
                {property.rating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-6 h-6 text-brand-yellow fill-brand-yellow mr-2" />
                    <span className="text-2xl font-bold text-brand-dark">{property.rating}</span>
                    <span className="text-brand-dark/50 ml-2">({property.review_count} reviews)</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-8">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 last:border-0 pb-8 last:pb-0">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue font-bold mr-3">
                            {review.renter_name?.charAt(0) || "U"}
                          </div>
                          <div>
                            <p className="font-bold text-brand-dark">{review.renter_name || "JustRentIt User"}</p>
                            <p className="text-xs text-brand-dark/40">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <p className="text-brand-dark/70 text-sm leading-relaxed mb-4">
                        {review.comment}
                      </p>
                      {/* Detailed Categories */}
                      <div className="flex flex-wrap gap-4 mt-2">
                        {(() => {
                          // 1. Determine Property Group
                          // Group A (Serviced): Hotel, Resort, Villa
                          const isGroupA = ["hotel", "resort", "villa"].includes(property.property_type?.toLowerCase());
                          const allowedCategories = isGroupA
                            ? ['cleanliness', 'safety', 'service_staff', 'amenities', 'accuracy', 'value', 'communication', 'location', 'maintenance']
                            : ['cleanliness', 'safety', 'check_in', 'amenities', 'accuracy', 'value', 'communication', 'location', 'maintenance'];

                          return Object.entries(review.categories || {})
                            .filter(([key, value]) => allowedCategories.includes(key) && value > 0)
                            .map(([key, value]) => (
                              <div key={key} className="flex items-center text-xs text-brand-dark/50 bg-gray-50 px-2 py-1 rounded">
                                <span className="capitalize mr-2">{key.replace('_', ' ')}</span>
                                <span className="font-bold text-brand-dark">{value}</span>
                              </div>
                            ));
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-brand-cream/30 rounded-xl">
                  <p className="text-brand-dark/50 italic">No reviews yet. Be the first to rent and review!</p>
                </div>
              )}
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
                  {property.rooms && property.rooms.length > 0 ? (
                    (() => {
                      const prices = property.rooms.map(r => property.rental_type === 'short_term' ? r.price_per_night : r.price_per_month).filter(p => p !== undefined && p !== null && p > 0);
                      if (prices.length > 0) {
                        const minPrice = Math.min(...prices);
                        return (
                          <div className="flex flex-col">
                            <span className="text-3xl font-bold text-brand-blue">
                              ₹{minPrice}
                            </span>
                            <span className="text-xs text-brand-dark/50">Starts from / {property.rental_type === 'short_term' ? 'night' : 'month'}</span>
                          </div>
                        )
                      }
                      // Fallback if no valid room prices
                      return <span className="text-3xl font-bold text-brand-blue">N/A</span>
                    })()
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-brand-blue">
                        {property.rental_type === 'short_term'
                          ? `₹${property.price_per_night}`
                          : `₹${property.price_per_month}`
                        }
                      </span>
                      <span className="text-brand-dark/50 ml-1">
                        {property.rental_type === 'short_term' ? '/night' : '/mo'}
                      </span>
                    </>
                  )}
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
                  if (property.rooms && property.rooms.length > 0 && !selectedRoom) {
                    // Scroll to room selection
                    document.getElementById('room-selection')?.scrollIntoView({ behavior: 'smooth' });
                    return;
                  }

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
                {property.status === 'available'
                  ? (property.rooms && property.rooms.length > 0 && !selectedRoom ? 'Select a Room' : 'Book Now')
                  : 'Not Available'}
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
          selectedRoom={selectedRoom}
          rentalType={property.rental_type}
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
            {galleryImages[currentImageIndex] && (
                <Image
                src={galleryImages[currentImageIndex]}
                alt={`Gallery Image ${currentImageIndex + 1}`}
                fill
                className="object-contain"
                />
            )}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
              {currentImageIndex + 1} / {galleryImages.length}
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
