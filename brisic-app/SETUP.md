# Brisic — production app

Next.js 16 (App Router, TypeScript, Tailwind v4) · Auth.js v5 (Google + email/password) · Prisma 6 · Neon Postgres.

## Run it
```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npx eslint src     # lint
```
Env files: `.env` holds `DATABASE_URL` + `DIRECT_URL`; `.env.local` holds the auth keys. Both are gitignored. See `.env.example` for every variable.

## What is built
Every prototype screen is now a real, responsive page (phone → tablet → desktop sidebar layout):

| Area | Routes |
|---|---|
| Sign in | `/login`, `/signup` (Google, or email + password with strength rules) |
| Listen | `/` Home, `/search`, `/genres`, `/genre/[id]`, `/trending`, `/stations`, `/see-all/[id]` |
| Music | `/artist/[id]`, `/album/[id]`, `/playlist/[id]`, `/player` (full player + lyrics), `/queue` |
| Library | `/library`, `/library/liked`, `/library/history`, `/library/playlists/[id]`, `/following` |
| Fans | `/artist/[id]/support`, `/gifts`, `/exclusive`, `/merch`, `/coins` |
| Podcasts | `/shows`, `/shows/[id]`, `/watch/[id]` |
| You | `/profile`, `/profile/edit`, `/settings`, `/notifications`, `/premium`, `/info/[topic]` |
| Other | `/ai` Brisic AI, `/party`, `/download` (get-the-app page) |

**Saved to the database per user:** liked songs, playlists (create, rename, delete, add/remove songs), followed artists, listening history (respects Private session), settings (player color applies live), B-Coin balance with a full ledger, gifts sent, exclusive unlocks, notifications. New accounts get 500 welcome B-Coins.

**Player:** persistent bar on every page, queue, shuffle, seek, next/prev, lock-screen metadata, queue restored after reload.

**Get-the-app:** a Spotify-style "Get app" banner on mobile web (dismissible, hidden inside the installed app), an "Install app" link on desktop, and `/download`. The site is installable today (web app manifest + icons). Set `NEXT_PUBLIC_APK_URL` to switch on the Android download button once the APK exists.

## Connecting the Global Tune API (one file)
All screens read music through one interface, `src/lib/catalog/types.ts`. Right now they use sample data (`mock.ts`).
1. Fill in `src/lib/catalog/globaltune.ts` — map the API's responses to `Track`, `Artist`, `Album`, ... Each method you leave out keeps using sample data, so you can connect it one call at a time. `Track.streamUrl` is what makes songs actually play.
2. Set `GLOBAL_TUNE_API_URL`, `GLOBAL_TUNE_API_KEY` and `CATALOG_PROVIDER="globaltune"`.
3. Set `isSample: false` in `globaltune.ts` to remove the "sample catalog" note.

## Not live yet (shown honestly in the UI)
- **Audio:** sample songs have no sound; the player simulates progress until the API provides stream URLs.
- **Payments:** Premium, coin packs and merch checkout are disabled ("opens when payments go live"). No card fields exist.
- **Community Party:** "coming soon" page — needs real-time sync.
- **Profile photo upload, email verification, password reset:** not built yet.

## Deploy (Vercel)
1. Import the repo, set **Root Directory** to `brisic-app`.
2. Env vars: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `DATABASE_URL` (the **pooled** URL), `DIRECT_URL`, plus the catalog vars.
3. Add the Vercel domain to the Google client (origin + `/api/auth/callback/google`).
4. **Google login is in Testing mode:** only listed test users can sign in. Add your partner's Gmail under Google Auth Platform → Audience → Test users, or publish the app.

## Database
Neon project `shy-resonance-92964381` (AWS US East, N. Virginia). Migrations live in `prisma/migrations`; apply with `npx prisma migrate deploy`. Create new ones with `npx prisma migrate dev --name <change>` in an interactive terminal. Never point a shadow database at this database: it gets wiped.
