import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { API_BASE_URL } from "./lib/auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string;
      role?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string;
    role?: string;
    token?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    user?: {
      id: string;
      email: string;
      name?: string;
      role?: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const user = await response.json();
          return user;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
        token.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = token.user as any;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
});
