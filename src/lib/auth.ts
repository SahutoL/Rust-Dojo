import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { isSessionAdminRole } from "@/lib/admin";
import { buildDisplayName, getSessionIdentityForUser } from "@/lib/account";
import { verifyCredentials } from "@/lib/auth-credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const result = await verifyCredentials(email, password);

        if (result.error || !result.user) {
          return null;
        }

        // 表示名のフォールバック: displayName → email の @ 前
        const displayName = buildDisplayName(
          email,
          result.user.profile?.displayName
        );

        return {
          id: result.user.id,
          email: result.user.email,
          name: displayName,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }

      if (typeof token.id !== "string") {
        token.adminRole = null;
        return token;
      }

      if (!user && trigger !== "update") {
        return token;
      }

      try {
        const identity = await getSessionIdentityForUser(token.id);

        if (identity) {
          token.name = identity.displayName;
          token.adminRole = identity.adminRole;
        } else {
          token.adminRole = null;
        }
      } catch (error) {
        console.error("Session identity sync error:", error);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        session.user.adminRole =
          isSessionAdminRole(token.adminRole) ? token.adminRole : null;
      }
      return session;
    },
  },
});
