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
| Sign in | `/login`, `/signup` (email, Google, Apple, Facebook), `/forgot-password`, `/reset-password` |
| Listen | `/` Home, `/search`, `/genres`, `/genre/[id]`, `/trending`, `/stations`, `/see-all/[id]` |
| Music | `/artist/[id]`, `/album/[id]`, `/playlist/[id]`, `/player` (full player + lyrics), `/queue` |
| Library | `/library`, `/library/liked`, `/library/history`, `/library/playlists/[id]`, `/following` |
| Fans | `/artist/[id]/support`, `/gifts` (tiered gifts), `/exclusive`, `/merch`, `/coins` (Naira bundles) |
| Spotlight | `/spotlight` (artist video hub: interviews, documentaries, performances, lives), `/spotlight/[id]` |
| Party | `/party` (create or join by code), `/party/[code]` (live room: queue, votes, chat) |
| Podcasts | `/shows`, `/shows/[id]`, `/watch/[id]` |
| You | `/profile`, `/profile/edit` (photo upload), `/settings` (password, delete account), `/notifications`, `/premium`, `/info/[topic]` |
| Creators | `/studio` (artists: overview & earnings, music, videos & live, exclusives & merch, profile; podcasters: shows & episodes) |
| Admin | `/admin` (overview & setup checklist), `/admin/creators`, `/admin/playlists`, `/admin/parties`, `/admin/content` |
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

## Keys still needed (add in Netlify → Environment variables, then redeploy)
Everything below is already built; each part switches on by itself when its keys are set. /admin shows a live checklist.

| What | Variables | Until then |
|---|---|---|
| Admin access | `ADMIN_EMAILS` (your email, comma separated) | /admin is hidden |
| Song, audio, photo uploads | `NEON_S3_ENDPOINT`, `NEON_S3_REGION`, `NEON_S3_ACCESS_KEY_ID`, `NEON_S3_SECRET_ACCESS_KEY`, `NEON_S3_BUCKET` | creators can only add YouTube videos, lives and links |
| Payments (B-Coins, Premium) | `PAYSTACK_SECRET_KEY` (+ webhook URL in Paystack) | Pay buttons are disabled |
| Emails (password reset, email confirmation) | `RESEND_API_KEY`, `EMAIL_FROM` | "Forgot password" is hidden, no confirmation emails |
| Facebook sign-in | `AUTH_FACEBOOK_ID`, `AUTH_FACEBOOK_SECRET` | button says "being set up" |
| Apple sign-in | `AUTH_APPLE_ID`, `AUTH_APPLE_SECRET` | button says "being set up" |
| YouTube direct upload (optional) | `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | creators paste YouTube links |

For local testing put the same names in `brisic-app/.env.local` (gitignored).

## Brisic's own catalog (no sample content)
Everything listeners see comes from the database; there is no sample music. A screen with nothing on it yet shows a friendly empty state ("Brisic is just getting started").

**Who makes what**
- **Admins** (`ADMIN_EMAILS`) at **/admin**:
  - *Overview*: listeners, creators, songs, plays, coin sales, gifts, Premium members, and the setup checklist.
  - *Creators*: invite an existing Brisic account as an **artist** (with name and genre) or a **podcaster**; remove access.
  - *Playlists*: make Brisic playlists from creators' songs, pick the **Home shelf** (Afro-pop, Playlist Made for you, Street Anthem, … Mood Boosters, or a new shelf), the card colour and the playlist-page artwork, add/reorder/remove songs, and order playlists inside a shelf. A playlist with no songs stays hidden.
  - *Parties*: start featured listening parties for Home's "Join a Party"; end them.
  - *Content*: search everything creators published (songs, videos, episodes, exclusives, merch) and take anything down.
- **Artists** at **/studio** (also "Open Creator Studio" on Profile and Settings):
  - *Overview*: total plays, plays this week, monthly listeners, followers, top songs and **earnings** (gifts + exclusive unlocks, in B-Coins).
  - *Music*: upload songs (MP3/M4A/WAV up to 80 MB, cover art, lyrics with `[Chorus]`-style sections, explicit flag). Songs with the same album name form an **album**. Edit or delete songs.
  - *Videos & Live*: Artist Spotlight videos by YouTube link, **go live** with a YouTube live link (followers are notified), end lives.
  - *Exclusives & Merch*: fan-only content sold for B-Coins (an unlisted YouTube video and/or an audio file; only fans who unlocked it can play it), and merch items with price, photo and a buy link to the artist's own store.
  - *Profile*: name, genre (drives genre pages and radio stations), bio, photo.
- **Podcasters** at **/studio**: create shows, publish episodes with a YouTube link (video or live) and/or an audio file.
- **Listeners**: everything else — Home, search, genres, stations (one per genre with songs), trending (real plays in the last 7 / 30 days), albums, playlists, Spotlight, podcasts, parties, library, gifts, exclusives, merch, coins, Premium.

**Notifications** are sent for: a new song, exclusive or live from an artist you follow; a gift or unlock you received (artists); coins added or Premium started after a payment.

- **Video playback** stays inside Brisic: YouTube embed with `playsinline=1` and `rel=0` (youtube-nocookie domain), so phones never leave the app and no outside channels are suggested.
- **Uploaded files** go straight from the phone to storage with a signed upload link, and play through `/api/media/...`, which checks the user is signed in (and, for exclusives, that they unlocked it) and redirects to a short-lived signed link.

### File storage (Neon Object Storage), one-time setup
1. Neon Console → the Brisic project → branch **production** → **Object storage** → **New bucket**, name `brisic-media`, access **private**.
2. **Connect** → **Storage** → **Parameters only**: copy the endpoint, region, access key id and secret.
3. Netlify → Environment variables: add `NEON_S3_ENDPOINT`, `NEON_S3_REGION`, `NEON_S3_ACCESS_KEY_ID`, `NEON_S3_SECRET_ACCESS_KEY`, `NEON_S3_BUCKET=brisic-media` (mark the two keys as secret). Netlify reserves the `AWS_*` names, so don't use those.
4. Allow uploads from the website (CORS), once: put the same values in `.env` and run `node --env-file=.env scripts/setup-storage.mjs`.
5. Redeploy. /admin shows "Neon storage connected".

### YouTube direct upload (later)
Already built: the creator picks a video file, the server opens a YouTube upload session on Brisic's channel with `privacyStatus: "unlisted"`, and the phone sends the file straight to YouTube. To switch it on: create the Brisic YouTube channel, enable **YouTube Data API v3** in the Google Cloud project, create an OAuth client, get a refresh token for the channel owner (scope `youtube.upload`), and set `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` in Netlify. Until Google approves the app (API audit), YouTube keeps API uploads private, so keep using pasted links for launch.

### Global Tune (if it ever arrives)
`src/lib/catalog/globaltune.ts` is still a plug-in point; set `CATALOG_PROVIDER="globaltune"` to use it. Anything it doesn't implement falls back to Brisic's own catalog.

## Paystack (B-Coin bundles)
Built: **Premium (Individual)** is paid once with Paystack in Naira for 1 or 12 months (no automatic renewal; buying again adds time; Duo, Family and Student say "coming soon"). The Coins page opens a Paystack checkout (card, bank transfer, USSD, mobile money) for the chosen bundle (₦100 to ₦250,000, 1 B-Coin = ₦1). Coins are added only after the server confirms the payment with Paystack's verify API, once per payment, from either the return page (`/api/paystack/callback`) or the webhook (`/api/paystack/webhook`, signature checked). Every checkout is stored in the `Payment` table.

To switch it on: Paystack Dashboard → Settings → **API Keys & Webhooks** → copy the **secret key** into Netlify as `PAYSTACK_SECRET_KEY` (mark it secret) and set the **Webhook URL** to `https://brisic.netlify.app/api/paystack/webhook`. Use the test key (`sk_test_…`) first; the page then says "Test mode" and Paystack's test cards work. Swap in the live key (`sk_live_…`) after Paystack approves the business. Merch is bought through each artist's own store link for now.

## Sign in with Apple and Facebook
The login and sign-up pages show Google, Apple and Facebook. Apple and Facebook start working when their keys are in Netlify:
- **Facebook:** developers.facebook.com → create an app → add **Facebook Login** → valid redirect URI `https://brisic.netlify.app/api/auth/callback/facebook` → set `AUTH_FACEBOOK_ID` (App ID) and `AUTH_FACEBOOK_SECRET` (App secret).
- **Apple:** needs an Apple Developer account (paid). Create a **Services ID** with Sign in with Apple, domain `brisic.netlify.app`, return URL `https://brisic.netlify.app/api/auth/callback/apple`, and a Sign in with Apple **key**. Set `AUTH_APPLE_ID` (the Services ID) and `AUTH_APPLE_SECRET` (the client-secret JWT made from the key; it expires every 6 months, so regenerate it).
Until then those buttons say the option is being set up.

## Turning on password-reset emails
Create a free account at resend.com, verify a domain, then add `RESEND_API_KEY` and `EMAIL_FROM` (e.g. `Brisic <noreply@yourdomain.com>`) to Netlify's environment variables and redeploy. Until then "Forgot password?" is hidden on the live site.

## Not live yet
- **Song uploads in production:** need the Neon storage bucket (see above). YouTube videos and lives work without it.
- **Payments:** B-Coin bundles and Premium go live with `PAYSTACK_SECRET_KEY` (above). Merch checkout inside Brisic is not built (artists link their own store).
- **Artist payouts:** earnings are recorded; paying artists to their bank needs Paystack Transfers (a Paystack business feature) and a payout form.
- **Premium perks:** Premium is sold and tracked, but nothing in the app is locked behind it yet (no ads exist, and offline downloads need the APK).
- **Smarter AI recommendations and song recognition:** Brisic AI matches genres, moods and names from the catalog; recognising a song playing nearby needs a recognition service.
- **Offline downloads:** need the Android app (APK).

## Deploy (Netlify)
`netlify.toml` at the repo root sets the base directory (`brisic-app`), Node 22, the build command (`npm run build:deploy`, which also applies database migrations), the Next.js runtime plugin and the secret-scan exceptions. Every push to `main` on `VarshithRao101/brisic` redeploys.

Netlify environment variables: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL=https://brisic.netlify.app`, `AUTH_TRUST_HOST=true`, plus the keys in "Keys still needed" above. `CATALOG_PROVIDER` is no longer needed (remove it or leave it as anything except `globaltune`).

Google Cloud → Google Auth Platform → Clients → "Brisic Web" has `https://brisic.netlify.app` (origin) and `https://brisic.netlify.app/api/auth/callback/google` (redirect). Google login is in Testing mode: add testers under Audience → Test users, or publish the app.

## Database
Neon project `shy-resonance-92964381` (AWS US East). Migrations live in `prisma/migrations` and are applied on every deploy. To add one, edit `schema.prisma`, then generate SQL without a shadow database:
```
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
npx prisma migrate deploy
```
Never point a shadow database at this database: it gets wiped.
