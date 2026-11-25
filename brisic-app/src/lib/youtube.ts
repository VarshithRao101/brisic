// YouTube for Artist Spotlight, video podcasts and lives.
//
// Day one: creators paste a YouTube link (video or live). Videos play inside Brisic in the
// YouTube embed with playsinline=1 and rel=0, so phones never leave the app and no outside
// channels are suggested at the end.
//
// Direct upload (YouTube Data API, videos.insert) is built in and switches on when
// YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET and YOUTUBE_REFRESH_TOKEN are set for Brisic's
// channel. Uploads are always privacyStatus "unlisted", so they only play inside Brisic.

const ID = /^[A-Za-z0-9_-]{11}$/;

/** Accepts youtu.be, youtube.com/watch, /live/, /shorts/, /embed/ links or a bare video id. */
export function parseYouTubeId(input: string): string | null {
  const raw = String(input ?? "").trim();
  if (ID.test(raw)) return raw;
  let url: URL;
  try { url = new URL(raw.startsWith("http") ? raw : `https://${raw}`); } catch { return null; }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v");
    const m = url.pathname.match(/^\/(?:live|shorts|embed|v)\/([^/?#]+)/);
    if (!id && m) id = m[1];
  }
  return id && ID.test(id) ? id : null;
}

/** Embed URL: inline on phones, no outside recommendations, small YouTube branding. */
export const youtubeEmbed = (id: string, autoplay = false) =>
  `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&color=white${autoplay ? "&autoplay=1" : ""}`;
export const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const youtubeUploadEnabled = () =>
  !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET && process.env.YOUTUBE_REFRESH_TOKEN);

async function accessToken() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!, grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error("YOUTUBE_AUTH");
  return ((await r.json()) as { access_token: string }).access_token;
}

/**
 * Starts a resumable upload to Brisic's channel and returns the session URL the browser PUTs
 * the video file to (so the file goes straight to YouTube, not through our servers).
 */
export async function startYouTubeUpload(opts: { title: string; description: string; size: number; contentType: string; origin: string }) {
  const token = await accessToken();
  const r = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(opts.size),
      "X-Upload-Content-Type": opts.contentType,
      // Lets the browser at this origin send the file to the session URL.
      Origin: opts.origin,
    },
    body: JSON.stringify({
      snippet: { title: opts.title.slice(0, 100), description: opts.description.slice(0, 4900), categoryId: "10" },
      status: { privacyStatus: "unlisted", embeddable: true, selfDeclaredMadeForKids: false },
    }),
  });
  const session = r.headers.get("location");
  if (!r.ok || !session) throw new Error("YOUTUBE_UPLOAD_START");
  return session;
}
