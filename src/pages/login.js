import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    const res = await signIn("credentials", {
      ...formData,
      redirect: false,
    });
    setLoading(false);

    if (res.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 rounded shadow-md w-96 space-y-6" onSubmit={handleSubmit}>
        <h1 className="text-xl font-bold mb-4">Login</h1>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="border px-3 py-2 w-full rounded" />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required className="border px-3 py-2 w-full rounded" />
        <button type="submit" className="bg-blue-900 text-white rounded px-4 py-2 w-full">{loading ? "Logging in..." : "Login"}</button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <p className="mt-4 text-sm">Don`&apos;`t have an account? <Link href="/signup" className="text-blue-900 underline">Sign Up</Link></p>
      </form>
    </div>
  );
}
