import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MapPin, ShieldCheck, Navigation, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function VerifyProperty() {
    const router = useRouter();
    const { id, address } = router.query;
    const [status, setStatus] = useState('idle'); // idle, locating, verifying, success, error
    const [errorMsg, setErrorMsg] = useState('');
    const [propertyTitle, setPropertyTitle] = useState('Loading...');

    useEffect(() => {
        if (id) {
            // Fetch property details
            fetch(`/api/properties/${id}`)
                .then(res => res.json())
                .then(data => setPropertyTitle(data.title))
                .catch(() => setPropertyTitle('Unknown Property'));
        }
    }, [id]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleVerification = async () => {
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
                    // Geocode via internal proxy to prevent CORS
                    const targetAddress = address || 'New York, USA'; // fallback
                    const res = await fetch(`/api/geocode?q=${encodeURIComponent(targetAddress)}`);
                    const data = await res.json();

                    if (!data || data.length === 0) {
                        setStatus('error');
                        setErrorMsg("Could not find coordinates for the property address.");
                        return;
                    }

                    const targetLat = parseFloat(data[0].lat);
                    const targetLon = parseFloat(data[0].lon);
                    const distance = calculateDistance(latitude, longitude, targetLat, targetLon);

                    if (distance <= 1.0) {
                        // Call API to update property status to 'verified'
                        const updateRes = await fetch(`/api/properties/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ verification_status: 'verified' })
                        });

                        if (updateRes.ok) {
                            setStatus('success');
                        } else {
                            throw new Error('Failed to update verification status.');
                        }
                    } else {
                        setStatus('error');
                        setErrorMsg(`Verification failed. You appear to be ${distance.toFixed(1)}km away from the property.`);
                    }
                } catch (error) {
                    setStatus('error');
                    setErrorMsg(error.message || 'Failed to verify location.');
                }
            },
            (error) => {
                setStatus('error');
                if (error.code === 1) setErrorMsg('Location permission denied.');
                else if (error.code === 2) setErrorMsg('Location unavailable.');
                else setErrorMsg('An error occurred while retrieving your location.');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    return (
        <div className="min-h-screen bg-brand-cream flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-brand-blue"></div>

                <div className="w-20 h-20 bg-brand-cream/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-blue/10">
                    <MapPin className="w-10 h-10 text-brand-blue" />
                </div>

                <h1 className="text-2xl font-bold text-brand-dark mb-2">Delegated Verification</h1>
                <p className="text-gray-600 text-sm mb-8">
                    You have been asked to securely verify the physical location for the property listing: <br />
                    <strong className="text-brand-dark">{propertyTitle}</strong>
                </p>

                {status === 'idle' && (
                    <button
                        onClick={handleVerification}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:bg-brand-blue/90 transition-all font-xl"
                    >
                        <Navigation className="w-6 h-6" />
                        Verify Physical Presence
                    </button>
                )}

                {(status === 'locating' || status === 'verifying') && (
                    <div className="py-8">
                        <Loader2 className="w-12 h-12 text-brand-blue animate-spin mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900">
                            {status === 'locating' ? 'Accessing GPS...' : 'Verifying Coordinates...'}
                        </h3>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-8 animate-in zoom-in">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Complete!</h3>
                        <p className="text-sm text-gray-600 mb-6">Thank you. The property has been verified successfully and the landlord has been notified.</p>
                        <button onClick={() => router.push('/')} className="text-brand-blue font-bold hover:underline">Return Home</button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-4 animate-in fade-in">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h3>
                        <p className="text-sm text-red-600 mb-6 bg-red-50 p-4 rounded-xl border border-red-100">{errorMsg}</p>
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
    );
}
