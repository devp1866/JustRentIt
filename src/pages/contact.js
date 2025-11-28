import Head from 'next/head';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                alert('Failed to send message. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('An error occurred. Please try again.');
        }
    };


    return (
        <div className="min-h-screen bg-brand-cream py-12">
            <Head>
                <title>Contact Us | JustRentIt</title>
                <meta name="description" content="Get in touch with the JustRentIt team for support or inquiries." />
            </Head>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-brand-dark mb-4">Get in Touch</h1>
                    <p className="text-xl text-brand-dark/70 max-w-2xl mx-auto">
                        Have questions about listing a property or finding your next home? We&apos;re here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Contact Information */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-2xl shadow-sm p-8 border border-brand-blue/10">
                            <h3 className="text-xl font-bold text-brand-dark mb-6">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start group">
                                    <div className="bg-brand-blue/10 p-3 rounded-xl mr-4 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                                        <Mail className="w-6 h-6 text-brand-blue group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-brand-dark">Email</p>
                                        <p className="text-brand-dark/70">dev_23509@ldrp.ac.in</p>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="bg-brand-blue/10 p-3 rounded-xl mr-4 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                                        <Phone className="w-6 h-6 text-brand-blue group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-brand-dark">Phone</p>
                                        <p className="text-brand-dark/70">+91 9106480244</p>
                                        <p className="text-sm text-brand-dark/50">Mon-Fri, 9am - 6pm IST</p>
                                    </div>
                                </div>
                                <div className="flex items-start group">
                                    <div className="bg-brand-blue/10 p-3 rounded-xl mr-4 group-hover:bg-brand-blue group-hover:text-white transition-colors duration-300">
                                        <MapPin className="w-6 h-6 text-brand-blue group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-brand-dark">Office</p>
                                        <p className="text-brand-dark/70">Gandhinagar, India</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 border border-brand-blue/10">
                            {submitted ? (
                                <div className="text-center py-12">
                                    <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Send className="w-10 h-10 text-brand-green" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-brand-dark mb-4">Message Sent!</h3>
                                    <p className="text-brand-dark/70 mb-8">
                                        Thank you for contacting us. We&apos;ll get back to you as soon as possible.
                                    </p>
                                    <button
                                        onClick={() => setSubmitted(false)}
                                        className="text-brand-blue font-bold hover:underline"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-brand-dark mb-2">Your Name</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-brand-dark mb-2">Email Address</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-brand-dark mb-2">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            required
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all bg-brand-cream/20"
                                            placeholder="How can we help?"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-brand-dark mb-2">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows="6"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 rounded-xl border border-brand-blue/20 focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none transition-all resize-none bg-brand-cream/20"
                                            placeholder="Tell us more about your inquiry..."
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.01] shadow-lg hover:shadow-xl"
                                    >
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
