import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, FileImage, X } from 'lucide-react';

export default function DisputeModal({ booking, onClose, userRole }) {
    const isLandlord = userRole === 'landlord';

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [claimAmount, setClaimAmount] = useState('');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const createDispute = useMutation({
        mutationFn: async (data) => {
            const res = await fetch('/api/tickets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to file dispute');
            return json;
        },
        onSuccess: () => {
            alert("Dispute ticket filed successfully. You can track it in the Resolution Center.");
            onClose(true);
        },
        onError: (err) => {
            setError(err.message);
        }
    });

    const uploadImages = async () => {
        if (files.length === 0) return [];

        setUploading(true);
        const uploadedUrls = [];

        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('type', 'dispute');
            formData.append('bookingId', booking._id);

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                const data = await res.json();
                if (res.ok && data.url) {
                    uploadedUrls.push(data.url);
                }
            } catch (err) {
                console.error("Upload error:", err);
            }
        }

        setUploading(false);
        return uploadedUrls;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title || !description) {
            setError("Title and description are required.");
            return;
        }

        if (isLandlord && files.length === 0) {
            setError("You must attach photographic evidence or receipts to file a property damage claim.");
            return;
        }

        try {
            const imageUrls = await uploadImages();

            createDispute.mutate({
                booking_id: booking._id,
                title,
                description,
                claim_amount: Number(claimAmount) || 0,
                severity: "high",
                initial_evidence: imageUrls
            });
        } catch (err) {
            setError("An error occurred during submission.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold flex items-center text-red-600 gap-2">
                        <AlertCircle className="w-6 h-6" /> Report Severe Issue
                    </h2>
                    <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isLandlord ? (
                    <p className="text-sm text-gray-600 mb-6">
                        As a <strong>Landlord</strong>, you must provide proof of value (receipts/invoices) for any monetary damage claims. False claims will result in platform suspension constraint to our Terms of Service.
                    </p>
                ) : (
                    <p className="text-sm text-gray-600 mb-6">
                        As a <strong>Renter</strong>, you can report severe issues like uninhabitable conditions or major safety hazards. Photographic evidence is highly recommended.
                    </p>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Issue Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                            placeholder={isLandlord ? "e.g. Broken television after checkout" : "e.g. Property uninhabitable, no electricity"}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Detailed Description *</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="4"
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500 border-gray-300 resize-none"
                            placeholder="Provide specific details about what occurred..."
                            required
                        />
                    </div>

                    {isLandlord && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Claim Amount (₹) *</label>
                            <input
                                type="number"
                                value={claimAmount}
                                onChange={(e) => setClaimAmount(e.target.value)}
                                min="1"
                                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-red-500 border-gray-300"
                                placeholder="Amount requested for damages"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Must be supported by attached receipts or invoices below.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                            Photographic Evidence {isLandlord ? "*" : "(Recommended)"}
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative overflow-hidden">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setFiles(Array.from(e.target.files))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <FileImage className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 font-medium">Click to upload photos</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                        </div>
                        {files.length > 0 && (
                            <p className="text-xs text-brand-blue mt-2 font-medium bg-brand-cream/50 p-2 rounded-lg border border-brand-blue/10">
                                {files.length} file(s) selected
                            </p>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => onClose(false)}
                            className="px-6 py-2.5 rounded-xl font-bold border border-gray-300 text-gray-700 flex-1 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createDispute.isPending || uploading}
                            className="px-6 py-2.5 rounded-xl font-bold bg-red-600 text-white flex-1 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                        >
                            {uploading ? 'Uploading Evidence...' : createDispute.isPending ? 'Filing Ticket...' : 'Submit Claim'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
