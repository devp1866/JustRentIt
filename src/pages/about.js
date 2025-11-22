import Head from 'next/head';
import { Users, Target, Shield } from 'lucide-react';

export default function About() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>About Us | JustRentIt</title>
                <meta name="description" content="Learn more about JustRentIt and our mission to simplify rental management." />
            </Head>

            {/* Hero Section */}
            <div className="bg-blue-900 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">About JustRentIt</h1>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                        We are revolutionizing the way people rent and manage properties.
                        Simple, transparent, and efficient for everyone.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

                {/* Mission Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Target className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
                        <p className="text-gray-600">
                            To bridge the gap between landlords and renters with a seamless, technology-driven platform that builds trust and convenience.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Community First</h3>
                        <p className="text-gray-600">
                            We believe in creating a community where finding a home or listing a property is as easy as a few clicks, supported by real people.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Trust & Safety</h3>
                        <p className="text-gray-600">
                            Your security is our priority. We verify listings and users to ensure a safe environment for all transactions.
                        </p>
                    </div>
                </div>

                {/* Developer Team Section */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Meet the Developers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                        {/* Developer 1 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="h-32 bg-gradient-to-r from-blue-600 to-blue-800"></div>
                            <div className="px-8 pb-8 text-center relative">
                                <div className="w-24 h-24 bg-white rounded-full p-1 mx-auto -mt-12 mb-4 shadow-md">
                                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                        <Users className="w-12 h-12" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Devkumar Patel</h3>
                                <p className="text-blue-600 font-medium mb-4">Co-Founder</p>
                                <p className="text-gray-600 leading-relaxed">
                                    Passionate about building scalable web applications and solving real-world problems through code.
                                    Driving the technical vision and architecture of JustRentIt.
                                </p>
                            </div>
                        </div>

                        {/* Developer 2 */}
                        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-800"></div>
                            <div className="px-8 pb-8 text-center relative">
                                <div className="w-24 h-24 bg-white rounded-full p-1 mx-auto -mt-12 mb-4 shadow-md">
                                    <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-400">
                                        <Users className="w-12 h-12" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-1">Jems Patel</h3>
                                <p className="text-indigo-600 font-medium mb-4">Co-Founder</p>
                                <p className="text-gray-600 leading-relaxed">
                                    Passionate about building scalable web applications and solving real-world problems through code.
                                    Driving the technical vision and architecture of JustRentIt.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}
