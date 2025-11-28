import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { User, Mail, Lock, Phone, MapPin, Building, FileText, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Register, 2: OTP
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    user_type: "renter",
    city: "",
    state: "",
    country: "",
    govt_id: "",
    preferred_city: "",
    budget_range: "",
    govt_id_image: ""
  });
  const [otp, setOtp] = useState("");
  const [uploadingId, setUploadingId] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGovtIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingId(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", "landlord");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) throw new Error("Upload failed");

      const json = await res.json();
      setFormData(prev => ({ ...prev, govt_id_image: json.url }));
    } catch (err) {
      console.error(err);
      setError("Failed to upload ID image");
    } finally {
      setUploadingId(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    // Landlord Validation
    if (formData.user_type === "landlord" || formData.user_type === "both") {
      if (!formData.city || !formData.state || !formData.country) {
        setError("City, State, and Country are required for landlords.");
        setLoading(false);
        return;
      }
      if (!formData.govt_id || !/^\d{12}$/.test(formData.govt_id)) {
        setError("Government ID must be a valid 12-digit number (Aadhar).");
        setLoading(false);
        return;
      }
      if (!formData.govt_id_image) {
        setError("Please upload a copy of your Government ID.");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      setSuccess(true);
      setStep(2); // Move to OTP step
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-brand-cream">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-dark">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center items-center p-12 text-white z-10 text-center">
          <h2 className="text-4xl font-bold mb-4">Join Our Community</h2>
          <p className="text-lg text-gray-200 max-w-md">
            Create an account to unlock exclusive features. Whether you are renting or listing, we have got you covered.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-brand-cream overflow-y-auto h-screen">
        <div className="w-full max-w-lg space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-brand-blue/10 my-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-brand-dark">
              {step === 1 ? "Create Account" : "Verify Email"}
            </h1>
            <p className="mt-2 text-brand-dark/70">
              {step === 1 ? "Get started with JustRentIt today" : `Enter the code sent to ${formData.email}`}
            </p>
          </div>

          {step === 1 ? (
            <form className="space-y-6" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-brand-blue" />
                      </div>
                      <input
                        type="text"
                        name="full_name"
                        placeholder="John Doe"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all outline-none bg-brand-cream/20 text-brand-dark"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-dark mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-brand-blue" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="10-digit number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{10}"
                        className="block w-full pl-10 pr-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all outline-none bg-brand-cream/20 text-brand-dark"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brand-blue" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all outline-none bg-brand-cream/20 text-brand-dark"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-brand-blue" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="block w-full pl-10 pr-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent transition-all outline-none bg-brand-cream/20 text-brand-dark"
                    />
                  </div>
                  <p className="text-xs text-brand-dark/50 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-brand-dark mb-2">I want to:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['renter', 'landlord', 'both'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, user_type: type })}
                        className={`py-2 px-3 rounded-xl border text-sm font-bold transition-all ${formData.user_type === type
                          ? 'bg-brand-blue text-white border-brand-blue ring-2 ring-brand-blue/20 shadow-md'
                          : 'bg-white text-brand-dark border-brand-blue/20 hover:bg-brand-cream/50'
                          }`}
                      >
                        {type === 'renter' && 'Rent'}
                        {type === 'landlord' && 'List'}
                        {type === 'both' && 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Landlord Specific Fields */}
                {(formData.user_type === "landlord" || formData.user_type === "both") && (
                  <div className="space-y-4 pt-4 border-t border-brand-blue/10 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-brand-dark flex items-center">
                      <Building className="w-4 h-4 mr-2 text-brand-blue" />
                      Landlord Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="text"
                          name="city"
                          placeholder="City"
                          value={formData.city || ""}
                          onChange={handleChange}
                          className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          name="state"
                          placeholder="State"
                          value={formData.state || ""}
                          onChange={handleChange}
                          className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        name="country"
                        placeholder="Country"
                        value={formData.country || ""}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                      />
                    </div>
                    <div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FileText className="h-5 w-5 text-brand-blue" />
                        </div>
                        <input
                          type="text"
                          name="govt_id"
                          placeholder="Govt ID (12 digits)"
                          value={formData.govt_id || ""}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                        />
                      </div>
                      <p className="text-xs text-brand-yellow/80 mt-1 ml-1 font-medium">
                        Required for verification. Cannot be changed later.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-brand-dark mb-1">Govt ID Image</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGovtIdUpload}
                          disabled={uploadingId}
                          className="block w-full text-sm text-brand-dark/70 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer"
                        />
                        {uploadingId && <Loader2 className="w-4 h-4 animate-spin absolute right-2 top-3 text-brand-blue" />}
                        {formData.govt_id_image && !uploadingId && (
                          <span className="text-xs text-brand-green absolute right-2 top-3 flex items-center font-bold">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Renter Specific Fields */}
                {(formData.user_type === "renter" || formData.user_type === "both") && (
                  <div className="space-y-4 pt-4 border-t border-brand-blue/10 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-bold text-brand-dark flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-brand-blue" />
                      Renter Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="preferred_city"
                        placeholder="Preferred City"
                        value={formData.preferred_city || ""}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                      />
                      <input
                        type="text"
                        name="budget_range"
                        placeholder="Budget (e.g. 10k-20k)"
                        value={formData.budget_range || ""}
                        onChange={handleChange}
                        className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none bg-brand-cream/20 text-brand-dark"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-brand-dark/70">
                Already have an account?{" "}
                <Link href="/login" className="font-bold text-brand-blue hover:text-brand-dark transition-colors">
                  Sign In
                </Link>
              </p>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-700">Email verified! Redirecting...</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">Verification Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="block w-full px-3 py-3 border border-brand-blue/20 rounded-xl focus:ring-2 focus:ring-brand-blue/50 focus:border-transparent outline-none text-center text-2xl tracking-widest font-mono bg-brand-cream/20 text-brand-dark"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-blue hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-brand-dark/50 hover:text-brand-dark transition-colors"
              >
                Back to Signup
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
