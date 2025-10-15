import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../utils/db";
import User from "../../../models/User";

export default NextAuth({
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

        // TODO: Use hashed passwords in production!
        if (user.password !== credentials.password) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          email: user.email,
          user_type: user.user_type || "renter",
          name: user.full_name || "",
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.user_type = user.user_type;
      }
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
