// pages/login.js
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const router = useRouter();
    const { data: session, status } = useSession();
    if (status === "loading") return <div>Loading...</div>;
    if (!session) return <div>Not authorized</div>;

    const handleSubmit = async (e) => {
        e.preventDefault();
        await signIn("credentials", {
            email: form.email,
            password: form.password,
            callbackUrl: "/"
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            <button type="submit">Login</button>
        </form>
    );
}
