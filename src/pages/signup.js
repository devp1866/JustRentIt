import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Signup failed");
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500); // delay to show success
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        className="bg-white p-8 rounded shadow-md w-96 space-y-6"
        onSubmit={handleSubmit}
      >
        <h1 className="text-xl font-bold mb-4">Sign Up</h1>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className="border px-3 py-2 w-full rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border px-3 py-2 w-full rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          className="border px-3 py-2 w-full rounded"
        />

        <button
          type="submit"
          className="bg-blue-900 text-white rounded px-4 py-2 w-full"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && (
          <p className="text-green-600 mt-2">
            Account created! Redirecting to login...
          </p>
        )}

        <p className="mt-4 text-sm">
          Already have an account?
          <Link href="/login" className="text-blue-900 underline ml-1">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
