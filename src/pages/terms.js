import React from 'react';
import Head from 'next/head';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <Head>
                <title>Terms of Service - JustRentIt</title>
            </Head>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-gray-500 mb-8">Last Updated: November 26, 2025</p>

                    <div className="space-y-8 text-gray-700">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the JustRentIt platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Nature of Service</h2>
                            <p>
                                JustRentIt acts solely as an intermediary platform connecting Renters and Landlords. We do not own, manage, or operate any properties listed on the Service. We are not a party to any rental agreement entered into between users.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>You must be at least 18 years old to create an account.</li>
                                <li>You agree to provide accurate, current, and complete information during registration.</li>
                                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                                <li>You are responsible for all activities that occur under your account.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Roles</h2>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-gray-900">For Renters</h3>
                                    <p>You agree to use properties responsibly, pay rent on time, and adhere to all house rules set by the Landlord.</p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">For Hosts/Landlords</h3>
                                    <p>You represent that you have the legal right to lease the property. You are responsible for ensuring your property meets all safety and health standards.</p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Property Listings Standards</h2>
                            <p>All listings must be accurate and truthful. Misleading descriptions, fake photos, or withholding information about material defects is strictly prohibited.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Booking & Payment Rules</h2>
                            <p>
                                Bookings are confirmed only upon successful payment. JustRentIt facilitates payments but is not a bank. All financial transactions are processed through secure third-party payment gateways.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cancellation Rules</h2>
                            <p>
                                Cancellation policies are defined by the Host/Landlord for each property. Renters should review these policies carefully before booking. JustRentIt fees are non-refundable unless stated otherwise.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Prohibited Activities</h2>
                            <p>Users may not:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Use the Service for any illegal purpose.</li>
                                <li>Harass, abuse, or harm another person.</li>
                                <li>Spam or solicit other users for commercial purposes unrelated to the Service.</li>
                                <li>Interfere with the proper working of the Service.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Liability Disclaimer</h2>
                            <p>
                                JustRentIt is not liable for any damages, losses, or injuries resulting from the use of the Service or any rental transaction. Users assume all risks associated with renting or listing a property.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Data Usage</h2>
                            <p>
                                By using the Service, you agree to our collection and use of your personal information as described in our Privacy Policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Account Suspension & Termination</h2>
                            <p>
                                We reserve the right to suspend or terminate accounts that violate these Terms or engage in fraudulent or harmful behavior.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
                            <p>
                                We may update these Terms from time to time. Continued use of the Service constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Info</h2>
                            <p>
                                For questions about these Terms, please contact us at <a href="mailto:devp1866@gmail.com" className="text-blue-600 hover:underline">devp1866@gmail.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
