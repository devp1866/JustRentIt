import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "../../../utils/db";
import User from "../../../models/User";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
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
        if (user.password !== credentials.password) throw new Error("Invalid password");
        return {
          id: user._id.toString(),
          email: user.email,
          user_type: user.user_type || "renter", // fallback if undefined
          name: user.full_name || "",           // optional
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // On first login, set data from Google/Credentials
      if (user) {
        token.id = user.id || user.sub || token.id || "";
        token.email = user.email || token.email || "";
        token.name = user.name || token.name || "";
        // For credentials users, user_type comes from DB. For Google, fallback to "renter"
        token.user_type = user.user_type || "renter";
      }
      // For Google provider, make sure token has a user_type; fallback to "renter"
      if (!token.user_type) token.user_type = "renter";
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.user_type = token.user_type;
      session.user.name = token.name;
      session.user.email = token.email;
      return session;
    },
  },
});
