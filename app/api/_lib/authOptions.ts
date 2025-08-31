import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "DevJWT",
      credentials: {
        token: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        const token = credentials?.token?.trim();
        if (!token) return null;
        // In dev, accept any non-empty token; a real impl would verify a signature
        return { id: "dev-user", name: "Dev User" } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = (user as any).id || token.sub || "dev-user";
      return token;
    },
    async session({ session, token }) {
      (session as any).userId = token.sub || "dev-user";
      return session;
    },
  },
};

