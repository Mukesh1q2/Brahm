import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authOptions } from "@/app/api/_lib/authOptions";

const handler = NextAuth(authOptions as NextAuthOptions);
export { handler as GET, handler as POST };

