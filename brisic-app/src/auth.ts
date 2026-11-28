import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Facebook from "next-auth/providers/facebook";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hit, ipFrom } from "@/lib/rate-limit";
import { setUpNewUser } from "@/lib/users";
import { socialProviders } from "@/lib/social";

const social = socialProviders();

/** Sent to the login form when too many attempts were made. */
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

// Compared against when the email has no password, so a wrong email and a wrong
// password take the same time (no hint about which accounts exist).
const DUMMY_HASH = "$2b$12$s48vj1L8I13aLdE8G6i4GuAkS8lDUpQF99u6aKBOoqw7ShKxenOwq";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT sessions: required for email + password sign-in, and fast on serverless.
  session: { strategy: "jwt" },
  providers: [
    // Each reads AUTH_<NAME>_ID / AUTH_<NAME>_SECRET from env and is only switched on when both are set.
    Google,
    ...(social.apple ? [Apple] : []),
    ...(social.facebook ? [Facebook] : []),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds, request) {
        const email = String(creds?.email ?? "").trim().toLowerCase().slice(0, 200);
        const password = String(creds?.password ?? "").slice(0, 200);
        if (!email || !password) return null;

        // At most 8 tries per email and 30 per IP every 15 minutes.
        const ip = request ? ipFrom(request.headers) : "unknown";
        const [byEmail, byIp] = await Promise.all([
          hit("login:email:" + email, 8, 900),
          hit("login:ip:" + ip, 30, 900),
        ]);
        if (!byEmail.ok || !byIp.ok) throw new TooManyAttempts();

        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        return ok && user?.passwordHash ? { id: user.id, name: user.name, email: user.email, image: user.image } : null;
      },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) await setUpNewUser(user.id);
    },
  },
});
