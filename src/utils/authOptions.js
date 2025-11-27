import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "./db";
import User from "../models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await dbConnect();
                const user = await User.findOne({ email: credentials.email });
                if (!user) throw new Error("No user found");
                if (user.is_active === false) throw new Error("Account is deactivated");

                let isValid = false;
                // Try bcrypt
                try {
                    isValid = await bcrypt.compare(credentials.password, user.password);
                } catch (e) {
                    // Ignore
                }

                // Fallback to plain text
                if (!isValid && user.password === credentials.password) {
                    isValid = true;
                }

                if (!isValid) throw new Error("Invalid password");

                return {
                    id: user._id.toString(),
                    email: user.email,
                    user_type: user.user_type || "renter",
                    name: user.full_name || "",
                    phone: user.phone || "",
                };
            },
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 15 * 24 * 60 * 60, // 15 days
    },
    pages: { signIn: "/login" },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.user_type = user.user_type;
                token.phone = user.phone;
            }
            if (trigger === "update" && session) {
                if (session.user_type) token.user_type = session.user_type;
                if (session.phone) token.phone = session.phone;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id;
            session.user.user_type = token.user_type;
            session.user.name = token.name;
            session.user.email = token.email;
            session.user.phone = token.phone;
            return session;
        },
    },
};
