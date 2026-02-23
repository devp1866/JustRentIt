import React from 'react';
import SEO from '../components/SEO';
import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <SEO title="Privacy Policy" description="JustRentIt Privacy Policy - Learn how we collect, use, and protect your data." />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100">
                    <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8 font-medium">Last Updated: February 21, 2026</p>

                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                                Information We Collect
                            </h2>
                            <p className="mb-4">We collect various types of information to provide, maintain, and improve our Service.</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Personal Information:</strong> Name, email address, phone number, government ID (for verification), and profile photos.</li>
                                <li><strong>Property Information:</strong> Address, photos, amenities, pricing details, and booking availability.</li>
                                <li><strong>Location Data (Important):</strong> We explicitly request browser/GPS location data during the <strong>Geo-Verification</strong> process when a Landlord lists a property. This is strictly used to match physical presence with the listed address to prevent fraud. We do not continuously track your location.</li>
                                <li><strong>Device & Usage Data:</strong> IP address, browser type, interaction logs, and device information.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                                How We Use Your Data
                            </h2>
                            <p>We use your data primarily to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Facilitate bookings, chat, and communication between Renters and Landlords.</li>
                                <li>Verify identities and ensure platform safety (e.g., Geo-Verification, Co-Host Delegation Links).</li>
                                <li><strong>Dispute Resolution:</strong> Any evidence, chat logs, or claims uploaded to the Resolution Center are retained securely to aid in fair arbitration.</li>
                                <li>Process payments, issue payouts, and prevent financial fraud.</li>
                                <li>Provide customer support and enforce our Terms of Service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                                Data Sharing & Third Parties
                            </h2>
                            <p className="mb-4">We do not sell your personal data. We may share data strictly for operational purposes with:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Service Providers:</strong> Hosting infrastructure (Vercel, MongoDB), Email Services (Resend), Payment Processing (Razorpay or Stripe), and Geocoding APIs (Nominatim/OpenStreetMap).</li>
                                <li><strong>Other Users:</strong> When a booking is confirmed, necessary details (e.g., phone numbers, names) are shared between the Renter and Landlord. If a Landlord delegates verification, their Co-Host receives a secure verification link containing property details.</li>
                                <li><strong>Legal Authorities:</strong> If required by law, subpoena, or to protect our rights or the safety of our users.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                                Security & Storage
                            </h2>
                            <p>
                                We implement industry-standard encryption and security measures to protect your data. Passwords are cryptographically hashed. However, no method of transmission over the internet is 100% secure. Your data is stored on secure cloud servers with restricted access.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                                Cookies Policy
                            </h2>
                            <p>
                                We use session cookies and local storage to maintain your login state securely (via NextAuth), remember your preferences, and track analytics to improve the platform interface. You can control cookie preferences through your browser settings, though disabling them may degrade site functionality.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                                User Rights & Data Retention
                            </h2>
                            <p className="mb-4">You have the right to:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Access the personal data we hold about you via your Profile Dashboard.</li>
                                <li>Request corrections to inaccurate data.</li>
                                <li>Request deletion of your account and associated data.</li>
                            </ul>
                            <p className="mt-4 text-sm text-gray-500">
                                <em>Note:</em> We retain your data for as long as your account is active. Certain transactional records, dispute resolution logs, and banned account identifiers may be retained indefinitely for legal, audit, or safety purposes even after account deletion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">7</span>
                                Contact Information
                            </h2>
                            <p>
                                If you have any questions or concerns about this Privacy Policy, please contact our administrative team:
                            </p>
                            <p className="mt-2">
                                Email: <a href="mailto:devp1866@gmail.com" className="text-brand-blue font-bold hover:underline">devp1866@gmail.com</a>
                            </p>
                            <div className="mt-6 pt-6 border-t border-gray-100 flex gap-4 text-sm">
                                <Link href="/terms" className="text-gray-500 hover:text-brand-blue font-medium transition-colors">
                                    Review Terms of Service
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
