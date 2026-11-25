# Brisic — production app

Next.js 16 (App Router, TypeScript, Tailwind v4) · Auth.js v5 (Google + email/password) · Prisma 6 · Neon Postgres · deployed on Netlify (one site: pages + backend).

Live: https://brisic.netlify.app

## Run it
```
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npx eslint src     # lint
```
Env files: `.env` holds `DATABASE_URL` + `DIRECT_URL`; `.env.local` holds the auth keys. Both are gitignored. See `.env.example` for every variable.

## What is built
Every prototype screen is a real, responsive page (phone → tablet → desktop sidebar layout):

| Area | Routes |
|---|---|
| Sign in | `/login`, `/signup`, `/forgot-password`, `/reset-password` |
| Listen | `/` Home, `/search`, `/genres`, `/genre/[id]`, `/trending`, `/stations`, `/see-all/[id]` |
| Music | `/artist/[id]`, `/album/[id]`, `/playlist/[id]`, `/player` (full player + lyrics), `/queue` |
| Library | `/library`, `/library/liked`, `/library/history`, `/library/playlists/[id]`, `/following` |
| Fans | `/artist/[id]/support`, `/gifts` (tiered gifts), `/exclusive`, `/merch`, `/coins` (Naira bundles) |
| Spotlight | `/spotlight` (artist video hub: interviews, documentaries, performances, lives), `/spotlight/[id]` |
| Party | `/party` (create or join by code), `/party/[code]` (live room: queue, votes, chat) |
| Podcasts | `/shows`, `/shows/[id]`, `/watch/[id]` |
| You | `/profile`, `/profile/edit` (photo upload), `/settings` (password, delete account), `/notifications`, `/premium`, `/info/[topic]` |
| Other | `/ai` Brisic AI, `/download` (get-the-app page), `/api/health`, `/api/party/[code]` |

**Design:** matches the prototype in `Brisic-Prototype/`: B logo header, a 4-tab bottom bar (Home, Search, Library, Profile) around a centre Brisic AI waveform button, poster covers in Bebas Neue, illustrated artist portraits. **Themes:** Green, Red, Chrome, Purple and Gold (Settings) recolour the whole app and are saved per account.

**Brisic AI button:** voice commands use the browser's speech recognition (Chrome, Edge, Safari, Android), with typing as a fallback, and return playable picks. "Identify a song" needs an audio-recognition service and says so until one is connected.

**Community Party:** real rooms stored in the database. The host creates a room and shares the code (BRS-XXXXX) or link; listeners join, add songs, vote (the top-voted song plays next), chat and see who is in the room. Phones poll `/api/party/[code]` every 3.5 s, paused while the tab is hidden. The host can skip, close the chat or end the party. Rooms end after 6 idle hours.

**Saved per user:** liked songs, playlists, followed artists, listening history (kept to the newest 500, respects Private session), settings, profile photo, B-Coin balance with a full ledger, gifts, exclusive unlocks, notifications. New accounts get 500 welcome B-Coins.

**Accounts:** Google or email + password sign-up; change password (or add one to a Google account); password reset by email; profile photo upload (resized to 256px in the browser, stored in the database, cached forever); self-serve account deletion (removes all the user's data).

**Security:** passwords hashed with bcrypt; database-backed rate limits — login (8 per email / 30 per IP per 15 min), sign-up (5 per IP per hour), password reset and change, gifts/unlocks (20 per minute), playlists, photo uploads; coin spending is atomic and checked on the server; reset links are single-use, hashed, and expire in 30 minutes; login and reset never reveal whether an email has an account.

**Player:** persistent bar on every page, queue, shuffle, seek, next/prev, lock-screen metadata, queue restored after reload.

**Get-the-app:** "Get app" banner on mobile web, "Install app" on desktop, `/download`, installable web app. Set `NEXT_PUBLIC_APK_URL` to turn on the Android download button.

## Performance
- Every page fetches the user and its own data in **one parallel round trip** (no waterfall); pages that only need the login read it from the session cookie without a database call.
- On Netlify the app always goes through Neon's **connection pooler** with a small per-instance pool, so traffic spikes cannot exhaust database connections.
- Indexed lookups for every per-user list (likes, history, notifications incl. unread count, playlists, ledger).
- **Keep-awake:** `netlify/functions/keep-warm.mjs` pings `/api/health` every 4 minutes during peak hours (08:00–17:59 UTC) so Neon does not fall asleep. Neon's free plan has a monthly compute allowance; staying awake 24/7 would use it up in about two weeks, so widen the hours only on a paid plan.

## Brisic's own catalog (creators)
Global Tune has no release date, so Brisic runs its own catalog (`src/lib/catalog/brisic.ts`): songs, videos, lives and podcasts uploaded by **invited creators**, stored in Postgres with files in object storage. Real content comes first on every screen; sample content fills the rest until there is enough real music. Uploaded songs count real plays, and an artist's monthly listeners are the distinct listeners in the last 30 days.

- **Admins** (emails in `ADMIN_EMAILS`) open **/admin** and invite a creator by the email of their Brisic account (they sign up first), as an *artist* or a *podcaster*.
- **Artists** open **Profile → Creator Studio** (/studio): edit their artist page and photo, upload songs (MP3/M4A/WAV up to 80 MB, with cover art), add Artist Spotlight videos by YouTube link, and **go live** by pasting a YouTube live link (shown as LIVE until they end it).
- **Podcasters** open **Podcast Studio**: create shows, publish episodes with a YouTube link (video or live) and/or an audio-only file for the Listen player.
- **Video playback** stays inside Brisic: YouTube embed with `playsinline=1` and `rel=0` (youtube-nocookie domain), so phones never leave the app and no outside channels are suggested.
- **Song and audio files** go straight from the phone to storage with a signed upload link, and play through `/api/media/...`, which checks the user is signed in and redirects to a one-hour signed link (range requests work for seeking).

### File storage (Neon Object Storage), one-time setup
1. Neon Console → the Brisic project → branch **production** → **Object storage** → **New bucket**, name `brisic-media`, access **private**.
2. **Connect** → **Storage** → **Parameters only**: copy the endpoint, region, access key id and secret.
3. Netlify → Environment variables: add `NEON_S3_ENDPOINT`, `NEON_S3_REGION`, `NEON_S3_ACCESS_KEY_ID`, `NEON_S3_SECRET_ACCESS_KEY`, `NEON_S3_BUCKET=brisic-media` (mark the two keys as secret). Netlify reserves the `AWS_*` names, so don't use those.
4. Allow uploads from the website (CORS), once: put the same values in `.env` and run `node --env-file=.env scripts/setup-storage.mjs`.
5. Redeploy. /admin shows "Neon storage connected".

### YouTube direct upload (later)
Already built: the creator picks a video file, the server opens a YouTube upload session on Brisic's channel with `privacyStatus: "unlisted"`, and the phone sends the file straight to YouTube. To switch it on: create the Brisic YouTube channel, enable **YouTube Data API v3** in the Google Cloud project, create an OAuth client, get a refresh token for the channel owner (scope `youtube.upload`), and set `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` in Netlify. Until Google approves the app (API audit), YouTube keeps API uploads private, so keep using pasted links for launch.

### Global Tune (if it arrives)
`src/lib/catalog/globaltune.ts` is still the plug-in point; set `CATALOG_PROVIDER="globaltune"` to use it.

## Turning on password-reset emails
Create a free account at resend.com, verify a domain, then add `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Brisic <noreply@yourdomain.com>`) to Netlify's environment variables and redeploy. Until then "Forgot password?" is hidden on the live site.

## Not live yet
- **Song uploads in production:** need the Neon storage bucket (see above). YouTube videos and lives work without it.
- **Payments:** Premium, the Paystack Naira coin bundles (₦100 to ₦250,000) and merch checkout are shown but disabled.
- **Spotlight video and party audio:** Spotlight shows posters with a preview timeline until videos come from the API; in a party, "Listen along" starts the current song at the room's position once audio exists.
- **Artist accounts and payouts, real AI recommendations, song recognition, offline downloads:** depend on the music catalog, payments, a recognition service or the APK.
- **Email verification at sign-up:** not built (needs the email service above).

## Deploy (Netlify)
`netlify.toml` at the repo root sets the base directory (`brisic-app`), Node 22, the build command (`npm run build:deploy`, which also applies database migrations), the Next.js runtime plugin and the secret-scan exceptions. Every push to `main` on `VarshithRao101/brisic` redeploys.

Netlify environment variables: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL=https://brisic.netlify.app`, `AUTH_TRUST_HOST=true`, `CATALOG_PROVIDER=mock` (+ `RESEND_API_KEY`, `EMAIL_FROM` for email).

Google Cloud → Google Auth Platform → Clients → "Brisic Web" has `https://brisic.netlify.app` (origin) and `https://brisic.netlify.app/api/auth/callback/google` (redirect). Google login is in Testing mode: add testers under Audience → Test users, or publish the app.

## Database
Neon project `shy-resonance-92964381` (AWS US East). Migrations live in `prisma/migrations` and are applied on every deploy. To add one, edit `schema.prisma`, then generate SQL without a shadow database:
```
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma migrate deploy
```
Never point a shadow database at this database: it gets wiped.
