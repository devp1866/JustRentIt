import Head from 'next/head';
import SEO from '../components/SEO';
import Link from 'next/link';
import { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, Book, Shield, CreditCard, Home } from 'lucide-react';

export default function HelpCenter() {
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const faqs = [
        {
            category: "Getting Started",
            icon: Home,
            items: [
                {
                    question: "How do I create an account?",
                    answer: "To create an account, click on the 'Sign Up' button in the top right corner. You can register using your email address and creating a password. Once registered, you can complete your profile to start renting or listing properties."
                },
                {
                    question: "Is JustRentIt free to use?",
                    answer: "Browsing properties is completely free for renters. Landlords can list their first property for free, with premium options available for multiple listings or featured placement."
                }
            ]
        },
        {
            category: "Booking & Payments",
            icon: CreditCard,
            items: [
                {
                    question: "How do I book a property?",
                    answer: "Find a property you like, select your dates, and click 'Book Now'. You'll be guided through the payment process. Your booking is confirmed once the landlord accepts it."
                },
                {
                    question: "What payment methods are accepted?",
                    answer: "We accept all major credit/debit cards, UPI, and net banking. All payments are processed securely through our payment partners."
                },
                {
                    question: "What is the cancellation and refund policy?",
                    answer: "Our standard cancellation policy is designed to be fair to both guests and landlords:\n• More than 30 days before check-in: 100% Refund\n• 7 to 30 days before check-in: 70% Refund\n• 3 to 7 days before check-in: 50% Refund\n• Less than 3 days: No Refund"
                }
            ]
        },
        {
            category: "Safety & Security",
            icon: Shield,
            items: [
                {
                    question: "How does JustRentIt verify users?",
                    answer: "We verify users through email and phone OTPs. Landlords are required to submit government ID and property ownership proof for verification."
                },
                {
                    question: "What if I have an issue with a property?",
                    answer: "If you encounter any issues, please contact our support team immediately. We offer 24/7 support to resolve disputes and ensure a safe experience."
                }
            ]
        }
    ];

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const filteredFaqs = faqs.map(category => ({
        ...category,
        items: category.items.filter(item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.items.length > 0);

    return (
        <div className="min-h-screen bg-brand-cream">
            <SEO title="Help Center" description="Find answers to your questions and get support from JustRentIt." />

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-brand-blue to-brand-blue/80 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6">How can we help you?</h1>
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-3.5 h-6 w-6 text-brand-blue" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-4 py-4 rounded-xl text-brand-dark focus:outline-none focus:ring-4 focus:ring-brand-yellow/50 shadow-xl text-lg placeholder-brand-dark/40"
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

                {/* Quick Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    <Link href="/privacy" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-brand-blue/10 group hover:-translate-y-1">
                        <div className="bg-brand-blue/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                            <Shield className="w-7 h-7 text-brand-blue group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-3">Privacy Policy</h3>
                        <p className="text-brand-dark/70 text-sm">Learn how we collect and protect your data.</p>
                    </Link>

                    <Link href="/terms" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-brand-blue/10 group hover:-translate-y-1">
                        <div className="bg-brand-blue/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                            <Book className="w-7 h-7 text-brand-blue group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-3">Terms of Service</h3>
                        <p className="text-brand-dark/70 text-sm">Read our terms and conditions for using the platform.</p>
                    </Link>

                    <Link href="/contact" className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all border border-brand-blue/10 group hover:-translate-y-1">
                        <div className="bg-brand-blue/10 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                            <HelpCircle className="w-7 h-7 text-brand-blue group-hover:text-white transition-colors" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-3">Contact Support</h3>
                        <p className="text-brand-dark/70 text-sm">Can&apos;t find what you need? Get in touch with us.</p>
                    </Link>
                </div>

                {/* FAQs */}
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-brand-dark mb-10 text-center">Frequently Asked Questions</h2>

                    {filteredFaqs.length === 0 ? (
                        <div className="text-center py-12 text-brand-dark/50">
                            <p className="text-lg">No results found for &quot;{searchQuery}&quot;</p>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {filteredFaqs.map((category, catIndex) => (
                                <div key={catIndex} className="bg-white rounded-2xl shadow-sm border border-brand-blue/10 overflow-hidden">
                                    <div className="bg-brand-blue/5 px-8 py-5 border-b border-brand-blue/10 flex items-center gap-4">
                                        <category.icon className="w-6 h-6 text-brand-blue" />
                                        <h3 className="text-lg font-bold text-brand-dark">{category.category}</h3>
                                    </div>
                                    <div className="divide-y divide-brand-blue/10">
                                        {category.items.map((item, itemIndex) => {
                                            const globalIndex = `${catIndex}-${itemIndex}`;
                                            const isOpen = openFaqIndex === globalIndex;

                                            return (
                                                <div key={itemIndex} className="group">
                                                    <button
                                                        onClick={() => toggleFaq(globalIndex)}
                                                        className="w-full px-8 py-5 text-left flex items-center justify-between hover:bg-brand-blue/5 transition-colors focus:outline-none"
                                                    >
                                                        <span className="font-medium text-brand-dark text-lg">{item.question}</span>
                                                        {isOpen ? (
                                                            <ChevronUp className="w-5 h-5 text-brand-blue" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-brand-dark/40 group-hover:text-brand-blue transition-colors" />
                                                        )}
                                                    </button>
                                                    {isOpen && (
                                                        <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-200">
                                                            <p className="text-brand-dark/70 leading-relaxed whitespace-pre-line">{item.answer}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Still need help? */}
                <div className="mt-20 text-center bg-brand-yellow/10 rounded-3xl p-10 md:p-16 border border-brand-yellow/20">
                    <h3 className="text-3xl font-bold text-brand-dark mb-4">Still need help?</h3>
                    <p className="text-brand-dark/70 mb-10 max-w-2xl mx-auto text-lg">
                        Our support team is available 24/7 to assist you with any questions or issues you may have.
                    </p>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-bold rounded-xl text-brand-dark bg-brand-yellow hover:bg-brand-yellow/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </div>
    );
}
