import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: string;
      status: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, request) {
        // Rate limit: 5 спроб / 15 хв з одного IP
        const ip = getClientIp(request as Request);
        const rl = await checkRateLimit({
          key: `login:${ip}`,
          maxAttempts: 5,
          windowSeconds: 900
        });
        if (!rl.allowed) throw new Error("RATE_LIMITED");

        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const rows = await sql`
          SELECT id, email, name, avatar_url, password_hash, role, status
          FROM users
          WHERE email = ${email}
          LIMIT 1
        `;
        const user = rows[0];
        if (!user?.password_hash) return null;

        const valid = await bcrypt.compare(password, user.password_hash as string);
        if (!valid) return null;

        const status = user.status as string;

        if (status === "pending") {
          throw new Error("PENDING");
        }
        if (status === "banned") {
          throw new Error("BANNED");
        }

        // Оновлюємо last_login_at асинхронно — не блокуємо логін
        sql`UPDATE users SET last_login_at = now() WHERE id = ${user.id as string}`.catch(() => {});

        return {
          id: user.id as string,
          email: user.email as string,
          name: (user.name as string | null) ?? null,
          image: (user.avatar_url as string | null) ?? null,
          role: (user.role as string) ?? "user",
          status
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "user";
        token.status = (user as { status?: string }).status ?? "active";
        token.picture = (user as { image?: string | null }).image ?? null;
      }
      if (trigger === "update" && updateData) {
        if (updateData.image !== undefined) token.picture = updateData.image;
        if (updateData.name !== undefined) token.name = updateData.name;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = (token.role as string) ?? "user";
      session.user.status = (token.status as string) ?? "active";
      session.user.image = (token.picture as string | null) ?? null;
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: { strategy: "jwt" }
});
