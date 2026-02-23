import React from 'react';
import SEO from '../components/SEO';
import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <SEO title="Terms of Service" description="JustRentIt Terms of Service - Read the rules and guidelines for using our platform." />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-3xl shadow-sm p-8 md:p-12 border border-gray-100">
                    <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Terms of Service</h1>
                    <p className="text-gray-500 mb-8 font-medium">Last Updated: February 21, 2026</p>

                    <div className="space-y-8 text-gray-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">1</span>
                                Acceptance of Terms
                            </h2>
                            <p>
                                By accessing or using the JustRentIt platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. This includes our Privacy Policy and all other guidelines. If you do not agree, please do not use our Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">2</span>
                                Nature of Service
                            </h2>
                            <p className="p-4 bg-brand-cream/30 rounded-xl border border-brand-yellow/20 text-brand-dark/80">
                                <strong>Important:</strong> JustRentIt acts solely as a technological intermediary connecting Renters and Landlords. We do not own, manage, or operate any properties listed on the Service. We are not a party to any rental agreement entered into between users.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">3</span>
                                User Accounts & Verification
                            </h2>
                            <p className="mb-4">You must be at least 18 years old to create an account. You agree to provide accurate, current, and complete information.</p>
                            <h3 className="font-bold text-gray-900 mb-2 mt-4">Geo-Verification Policy (For Landlords)</h3>
                            <p>
                                To ensure the authenticity of listings on our platform, Landlords are required to complete a <strong>Geo-Verification check</strong> when listing a property. This checks your current GPS location against the entered property address.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>If you are not physically at the property, you may use our <strong>Delegated Verification</strong> system to send a verification link to your Property Manager or Co-Host.</li>
                                <li>Listings that fail geo-verification or are found to be fraudulent will be permanently removed, and the associated accounts suspended.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">4</span>
                                Bookings, Payments, and Fees
                            </h2>
                            <p className="mb-4">
                                Bookings are confirmed only upon successful payment. JustRentIt facilitates payments but relies on third-party payment processors.
                            </p>
                            <h3 className="font-bold text-gray-900 mb-2 mt-4">Fee Structure</h3>
                            <p>We operate on a split-fee model to keep our platform running:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Renters:</strong> Pay a nominal Platform Service Fee (approximately 2.5%) added to their booking total at checkout.</li>
                                <li><strong>Landlords:</strong> Incur a small Processing Fee (approximately 3%) deducted from their final payout.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">5</span>
                                Dispute Resolution Center
                            </h2>
                            <p className="mb-4">
                                In the event of property damage, misrepresentation, or severe rules violations, users must utilize our built-in <strong>Dispute Resolution Center</strong>.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li><strong>Filing a Claim:</strong> Claims must be filed within 14 days of checkout. You must provide photographic evidence, a description, and the requested compensation amount.</li>
                                <li><strong>Communication:</strong> All dispute communication must occur within the platform's secure Dispute Chat. Off-platform communications will not be considered in arbitration.</li>
                                <li><strong>Arbitration:</strong> If the two parties cannot reach an agreement within 7 days of a claim being filed, JustRentIt Administrators will step in to arbitrate. Administrator decisions are final.</li>
                            </ul>
                            <div className="mt-4">
                                <Link href="/resolution-center" className="text-brand-blue font-bold hover:underline">
                                    Visit the Dispute Resolution Center &rarr;
                                </Link>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">6</span>
                                Cancellation Rules
                            </h2>
                            <p>
                                Cancellation policies are defined by the Host/Landlord for each property (e.g., Strict, Flexible). Renters should review these policies carefully before booking. JustRentIt platform and processing fees are generally non-refundable unless resulting from host cancellation.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">7</span>
                                Limitation of Liability
                            </h2>
                            <p>
                                <strong>JustRentIt is not liable</strong> for any damages, losses, or injuries resulting from the use of the Service or any rental transaction. Users assume all risks associated with renting or listing a property. While we enforce verification and dispute resolution, we do not guarantee the safety, habitability, or legal compliance of any property.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="bg-brand-blue/10 text-brand-blue w-8 h-8 rounded-lg flex items-center justify-center text-sm">8</span>
                                Contact Us
                            </h2>
                            <p>
                                If you experience technical issues, witness platform abuse, or have questions regarding these Terms, please contact our Support team.
                            </p>
                            <p className="mt-2">
                                Email: <a href="mailto:devp1866@gmail.com" className="text-brand-blue font-bold hover:underline">devp1866@gmail.com</a>
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
