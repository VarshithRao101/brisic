# Brisic — production app setup

Next.js 16 (App Router, TypeScript, Tailwind v4) + Auth.js (NextAuth v5) Google OAuth + Prisma 6 + Postgres (Neon).

## What works right now
- Responsive **Login** screen (`/login`) with working **Continue with Google**.
- Auth-gated **Home** (`/`) — redirects to `/login` when signed out; greets the user, shows catalog rows (placeholder) and a bottom nav when signed in.
- NextAuth endpoints live at `/api/auth/*`.
- Prisma schema for users + OAuth accounts/sessions (with `coins`, `isPremium`).
- `npm run build` passes clean.

## To make it fully live — 3 credentials needed

### 1. Google OAuth
Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application.
- Authorized JavaScript origin: `http://localhost:3000` (and later your Vercel URL)
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
  (and later `https://YOUR-VERCEL-DOMAIN/api/auth/callback/google`)

Put the values in `.env.local`:
```
AUTH_GOOGLE_ID="...apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="..."
```

### 2. Database (Neon Postgres)
Create a free project at neon.tech, copy the connection string into `.env.local`:
```
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
```
Then create the tables:
```
npx prisma migrate dev --name init
```

### 3. Deploy (Vercel)
- Import the repo in Vercel, set **Root Directory** to `brisic-app`.
- Add env vars in Vercel: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL`.
- Add the Vercel domain to Google's authorized origins/redirects (step 1).

## Dev
```
npm run dev      # http://localhost:3000
npm run build    # production build
```

`AUTH_SECRET` is already generated in `.env.local`.

## Next build steps (daily dev)
- Music catalog + search + playback (pick API: Spotify / Deezer / Audius).
- Rebuild remaining screens (Library, Search, Artist, Playlist, Profile, etc.).
- Payments (Paystack/Stripe) on the Premium page.
- Package as APK (Capacitor / TWA) at the end.
