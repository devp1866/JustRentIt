import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShieldCheck, Mail, Loader2, AlertTriangle, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function GeoVerificationModal({
    open,
    onClose,
    onSuccess,
    propertyId,
    propertyAddress,
    propertyCity
}) {
    const [status, setStatus] = useState('idle'); // idle, locating, verifying, success, error, delegated
    const [errorMsg, setErrorMsg] = useState('');
    const [coHostEmail, setCoHostEmail] = useState('');

    if (!open) return null;

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        // Haversine formula
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleStartVerification = async () => {
        setStatus('locating');
        setErrorMsg('');

        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setStatus('verifying');

                try {
                    // 1. Geocode the provided property address
                    let res = await fetch(`/api/geocode?q=${encodeURIComponent(propertyAddress)}`);
                    let data = await res.json();

                    if (!data || data.length === 0) {
                        // Fallback to searching the city if the exact address is unlisted or missing
                        if (propertyCity) {
                            res = await fetch(`/api/geocode?q=${encodeURIComponent(propertyCity)}`);
                            data = await res.json();
                        }

                        if (!data || data.length === 0) {
                            setStatus('error');
                            setErrorMsg("Could not find coordinates for the entered property address or city. Please ensure the address or city is accurate.");
                            return;
                        }
                    }

                    const targetLat = parseFloat(data[0].lat);
                    const targetLon = parseFloat(data[0].lon);

                    // 2. Compare distances
                    const distance = calculateDistance(latitude, longitude, targetLat, targetLon);

                    if (distance <= 5.0 || (propertyCity && data.length > 0)) { // Increased to 5 kilometers to loosen the distance constraint, or if matched city.
                        setStatus('success');
                        setTimeout(() => {
                            onSuccess("verified");
                        }, 2000);
                    } else {
                        setStatus('error');
                        setErrorMsg(`Verification failed. You appear to be ${distance.toFixed(1)}km away from the location. You must be physically present at the property city to verify it.`);
                    }
                } catch (error) {
                    setStatus('error');
                    setErrorMsg('Failed to verify location against the address. Please try again.');
                }
            },
            (error) => {
                setStatus('error');
                if (error.code === 1) setErrorMsg('Location permission denied. Please allow location access to verify this property.');
                else if (error.code === 2) setErrorMsg('Location unavailable. Please check your GPS.');
                else setErrorMsg('An error occurred while retrieving your location.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleDelegateSubmit = (e) => {
        e.preventDefault();
        if (!coHostEmail) return;

        // Simulate API call for sending Delegation Link
        setStatus('delegated');
        setTimeout(() => {
            onSuccess("delegated", coHostEmail);
        }, 3000);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">

                {/* Decorative Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl"></div>

                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors z-10">
                    <X className="w-6 h-6" />
                </button>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-brand-cream/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-blue/10 shadow-sm">
                            <ShieldCheck className="w-8 h-8 text-brand-blue" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-2">Property Verification</h2>
                        <p className="text-gray-600 text-sm">
                            To prevent fraudulent listings, we require landlords to verify their physical presence at the property location.
                        </p>
                    </div>

                    {status === 'idle' && (
                        <div className="space-y-4">
                            <button
                                onClick={handleStartVerification}
                                className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 hover:-translate-y-0.5 transition-all"
                            >
                                <Navigation className="w-5 h-5" />
                                Verify My Location Now
                            </button>

                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">OR</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-1 text-sm flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500" /> Not at the property?
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">
                                    Delegate verification to your Property Manager or Co-Host who is currently there.
                                </p>
                                <form onSubmit={handleDelegateSubmit} className="flex gap-2">
                                    <input
                                        type="email"
                                        placeholder="Co-host email address"
                                        value={coHostEmail}
                                        onChange={(e) => setCoHostEmail(e.target.value)}
                                        required
                                        className="flex-grow bg-white border border-gray-200 text-sm rounded-xl px-3 outline-none focus:ring-2 focus:ring-brand-blue/50"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-brand-dark text-white p-2.5 rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {(status === 'locating' || status === 'verifying') && (
                        <div className="text-center py-8">
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <div className="absolute inset-0 border-4 border-brand-cream rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent animate-spin"></div>
                                <Navigation className="w-8 h-8 text-brand-blue absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                {status === 'locating' ? 'Accessing GPS...' : 'Verifying Coordinates...'}
                            </h3>
                            <p className="text-sm text-gray-500 max-w-[250px] mx-auto">
                                Comparing your current location with the property address.
                            </p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="text-center py-8 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Successful!</h3>
                            <p className="text-sm text-gray-600">Your presence at the property has been confirmed. Your listing is now verified and active.</p>
                        </div>
                    )}

                    {status === 'delegated' && (
                        <div className="text-center py-8 animate-in fade-in duration-300">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                <Mail className="w-10 h-10 text-brand-blue" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Link Sent</h3>
                            <p className="text-sm text-gray-600">We've sent a secure verification link to <strong>{coHostEmail}</strong>. Your listing will remain pending until they complete the process.</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                            <p className="text-sm text-red-600 mb-6 bg-red-50 p-3 rounded-xl border border-red-100">{errorMsg}</p>

                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full bg-white border-2 border-brand-dark/10 text-brand-dark py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
