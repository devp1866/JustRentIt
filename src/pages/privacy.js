import React from 'react';
import Head from 'next/head';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <Head>
                <title>Privacy Policy - JustRentIt</title>
            </Head>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8">Last Updated: November 26, 2025</p>

                    <div className="space-y-8 text-gray-700">
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Personal Information:</strong> Name, email address, phone number, government ID (for verification).</li>
                                <li><strong>Property Information:</strong> Address, photos, amenities, and pricing details.</li>
                                <li><strong>Device & Usage Data:</strong> IP address, browser type, and interaction logs.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Data</h2>
                            <p>We use your data to:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Facilitate bookings and communication between Renters and Landlords.</li>
                                <li>Verify identities and ensure platform safety.</li>
                                <li>Process payments and prevent fraud.</li>
                                <li>Improve our services and user experience.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Data Sharing</h2>
                            <p>We do not sell your personal data. We may share data with:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li><strong>Service Providers:</strong> Hosting (Vercel), Email (Resend), Payment Processing (Razorpay).</li>
                                <li><strong>Legal Authorities:</strong> If required by law or to protect our rights.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Security & Storage</h2>
                            <p>
                                We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure. Your data is stored on secure servers with restricted access.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookies Policy</h2>
                            <p>
                                We use cookies to maintain your session and analyze site traffic. You can control cookie preferences through your browser settings.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. User Rights</h2>
                            <p>You have the right to:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Access the personal data we hold about you.</li>
                                <li>Request corrections to inaccurate data.</li>
                                <li>Request deletion of your account and data (subject to legal retention requirements).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Integrations</h2>
                            <p>
                                Our Service may use third-party services like Google Login or mapping APIs. Your use of these features is subject to the respective privacy policies of those third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Age Restriction</h2>
                            <p>
                                Our Service is not intended for individuals under the age of 18. We do not knowingly collect data from minors.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Data Retention</h2>
                            <p>
                                We retain your data for as long as your account is active or as needed to provide services. We may retain certain data for legal or audit purposes even after account deletion.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Policy</h2>
                            <p>
                                We may update this Privacy Policy periodically. We will notify you of significant changes via email or a prominent notice on our site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at <a href="mailto:devp1866@gmail.com" className="text-blue-600 hover:underline">devp1866@gmail.com</a>.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
