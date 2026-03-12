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
                try {
                    isValid = await bcrypt.compare(credentials.password, user.password);
                } catch (e) {
                    // Ignore error to prevent timing attacks, let it fail at isValid check
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
            // When update() is called on the frontend, forcibly query the DB 
            // to ensure the JWT encapsulates the absolute latest DB state, preventing reload stales.
            if (trigger === "update") {
                try {
                    await dbConnect();
                    const User = (await import("../models/User")).default;
                    const freshUser = await User.findOne({ email: token.email });
                    if (freshUser) {
                        token.user_type = freshUser.user_type;
                        token.phone = freshUser.phone;
                    }
                } catch (error) {
                    console.error("JWT Update DB fetch failed:", error);
                    // Fallback to frontend trusting if DB fails
                    if (session?.user_type) token.user_type = session.user_type;
                    if (session?.phone) token.phone = session.phone;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session?.user) {
                session.user.id = token.id;
                session.user.user_type = token.user_type;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.phone = token.phone;
            }
            return session;
        },
    },
};
