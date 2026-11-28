"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isAdminEmail, slugify, type CreatorRole } from "@/lib/creators";
import { hit, waitText } from "@/lib/rate-limit";
import { exists, newKey, removeFile, storageMode, uploadUrl, UPLOAD_RULES, type UploadKind } from "@/lib/storage";
import { parseYouTubeId, startYouTubeUpload, youtubeUploadEnabled } from "@/lib/youtube";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const str = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const text = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const refresh = () => revalidatePath("/", "layout");

async function me() {
  const userId = await requireUserId();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, creatorRole: true, artistProfile: { select: { id: true, name: true } } },
  });
  if (!u) throw new Error("Not signed in");
  return u;
}
async function artistOnly() {
  const u = await me();
  if (u.creatorRole !== "artist" || !u.artistProfile) throw new Error("FORBIDDEN");
  return { userId: u.id, artist: u.artistProfile };
}
async function podcasterOnly() {
  const u = await me();
  if (u.creatorRole !== "podcaster") throw new Error("FORBIDDEN");
  return { userId: u.id };
}
const guard = async <T,>(fn: () => Promise<Result<T>>): Promise<Result<T>> => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Only invited creators can do this." };
    if (e instanceof Error && e.message === "STORAGE_OFF") return { ok: false, error: "File storage is not set up yet. Ask the Brisic team." };
    throw e;
  }
};

/** A unique URL slug that does not clash with existing creators. */
async function freeArtistId(name: string) {
  const base = slugify(name);
  for (let n = 1; n < 50; n++) {
    const id = n === 1 ? base : `${base}-${n}`;
    const taken = await prisma.artistProfile.findUnique({ where: { id }, select: { id: true } });
    if (!taken) return id;
  }
  return `${base}-${Date.now().toString(36)}`;
}
async function freeShowId(title: string) {
  const base = slugify(title);
  for (let n = 1; n < 50; n++) {
    const id = `sh-${n === 1 ? base : `${base}-${n}`}`;
    const taken = await prisma.podcastShow.findUnique({ where: { id }, select: { id: true } });
    if (!taken) return id;
  }
  return `sh-${base}-${Date.now().toString(36)}`;
}

// ---------- Admin: invite-only creators ----------

export async function adminGrantCreator(input: { email: string; role: CreatorRole; name: string; genre: string }): Promise<Result> {
  const admin = await me();
  if (!isAdminEmail(admin.email)) return { ok: false, error: "Only Brisic admins can invite creators." };
  const email = str(input.email, 200).toLowerCase();
  if (!["artist", "podcaster"].includes(input.role)) return { ok: false, error: "Pick artist or podcaster." };
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, artistProfile: { select: { id: true } } } });
  if (!user) return { ok: false, error: "No Brisic account uses that email yet. Ask them to sign up first." };
  const name = str(input.name, 60) || user.name || "New artist";
  await prisma.user.update({ where: { id: user.id }, data: { creatorRole: input.role } });
  if (input.role === "artist" && !user.artistProfile) {
    await prisma.artistProfile.create({ data: { id: await freeArtistId(name), userId: user.id, name, genre: str(input.genre, 40) || "Afrobeats" } });
  }
  revalidatePath("/admin");
  return { ok: true };
}

export async function adminRevokeCreator(userId: string): Promise<Result> {
  const admin = await me();
  if (!isAdminEmail(admin.email)) return { ok: false, error: "Only Brisic admins can do this." };
  // Their uploads stay; they just lose access to the studio.
  await prisma.user.update({ where: { id: str(userId, 40) }, data: { creatorRole: null } });
  revalidatePath("/admin");
  return { ok: true };
}

// ---------- Uploads (direct to storage) ----------

/** Returns a signed URL the browser uploads one file to. `scope` picks the folder. */
export async function startUpload(input: { kind: UploadKind; scope: "song" | "cover" | "artist" | "episode" | "exclusive" | "merch"; contentType: string; size: number; showId?: string }): Promise<Result<{ key: string; url: string; headers: Record<string, string> }>> {
  return guard<{ key: string; url: string; headers: Record<string, string> }>(async () => {
    const u = await me();
    const rules = UPLOAD_RULES[input.kind];
    if (!rules) return { ok: false, error: "Unsupported file." };
    if (!(rules.types as readonly string[]).includes(input.contentType)) {
      return { ok: false, error: input.kind === "audio" ? "Use an MP3, M4A, AAC, WAV, OGG or FLAC file." : "Use a JPG, PNG or WebP image." };
    }
    if (!(input.size > 0) || input.size > rules.maxBytes) return { ok: false, error: `That file is too big (max ${Math.round(rules.maxBytes / 1048576)} MB).` };
    const limit = await hit("upload:" + u.id, 60, 3600);
    if (!limit.ok) return { ok: false, error: `Too many uploads. Try again in ${waitText(limit.retryAfterSec)}.` };

    let prefix: string;
    if (input.scope === "episode") {
      if (u.creatorRole !== "podcaster") throw new Error("FORBIDDEN");
      const show = await prisma.podcastShow.findFirst({ where: { id: str(input.showId, 80), userId: u.id }, select: { id: true } });
      if (!show) return { ok: false, error: "Show not found." };
      prefix = `episodes/${show.id}`;
    } else {
      if (u.creatorRole !== "artist" || !u.artistProfile) throw new Error("FORBIDDEN");
      const folder = { song: "songs", cover: "covers", artist: "artists", exclusive: "exclusives", merch: "merch" }[input.scope];
      prefix = `${folder}/${u.artistProfile.id}`;
    }
    const key = newKey(prefix, input.contentType);
    const signed = await uploadUrl(key, input.contentType);
    return { ok: true, key, ...signed };
  });
}

const ownsKey = (key: string, prefix: string) => key.startsWith(prefix + "/") && !key.includes("..");

/** Tells everyone following an artist (newest 2,000 followers) about a release or a live. */
async function notifyFollowers(artistId: string, title: string, body: string, href: string) {
  const fans = await prisma.follow.findMany({ where: { artistId }, select: { userId: true }, orderBy: { createdAt: "desc" }, take: 2000 });
  if (fans.length) await prisma.notification.createMany({ data: fans.map((f) => ({ userId: f.userId, title: str(title, 120), body: str(body, 200), href })) });
}

// ---------- Artists ----------

export async function updateArtistProfile(input: { name: string; genre: string; bio: string; imageKey?: string | null }): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const name = str(input.name, 60);
    if (!name) return { ok: false, error: "Add your artist name." };
    const data: { name: string; genre: string; bio: string; imageKey?: string } = { name, genre: str(input.genre, 40) || "Afrobeats", bio: text(input.bio, 800) };
    if (input.imageKey) {
      if (!ownsKey(input.imageKey, `artists/${artist.id}`) || !(await exists(input.imageKey))) return { ok: false, error: "Photo upload did not finish. Try again." };
      const old = await prisma.artistProfile.findUnique({ where: { id: artist.id }, select: { imageKey: true } });
      data.imageKey = input.imageKey;
      if (old?.imageKey && old.imageKey !== input.imageKey) await removeFile(old.imageKey);
    }
    await prisma.artistProfile.update({ where: { id: artist.id }, data });
    refresh();
    return { ok: true };
  });
}

export async function publishSong(input: { title: string; albumTitle?: string; explicit: boolean; durationSec: number; audioKey: string; audioType: string; coverKey?: string | null; lyrics?: string }): Promise<Result<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    const { artist } = await artistOnly();
    const title = str(input.title, 100);
    if (!title) return { ok: false, error: "Add the song title." };
    if (!ownsKey(input.audioKey, `songs/${artist.id}`) || !(await exists(input.audioKey))) return { ok: false, error: "The audio upload did not finish. Try again." };
    if (input.coverKey && (!ownsKey(input.coverKey, `covers/${artist.id}`) || !(await exists(input.coverKey)))) return { ok: false, error: "The cover upload did not finish. Try again." };
    if (!(UPLOAD_RULES.audio.types as readonly string[]).includes(input.audioType)) return { ok: false, error: "Unsupported audio file." };
    const durationSec = Math.max(1, Math.min(4 * 3600, Math.round(Number(input.durationSec) || 0)));
    const song = await prisma.song.create({
      data: { artistId: artist.id, title, albumTitle: str(input.albumTitle, 100) || null, explicit: !!input.explicit, durationSec, audioKey: input.audioKey, audioType: input.audioType, coverKey: input.coverKey || null, lyrics: text(input.lyrics, 8000) || null },
    });
    await notifyFollowers(artist.id, `New from ${artist.name}`, `"${title}" is out now on Brisic.`, `/artist/${artist.id}`);
    refresh();
    return { ok: true, id: song.id };
  });
}

export async function deleteSong(id: string): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const song = await prisma.song.findFirst({ where: { id: str(id, 40), artistId: artist.id }, select: { id: true, audioKey: true, coverKey: true } });
    if (!song) return { ok: false, error: "Song not found." };
    await prisma.song.delete({ where: { id: song.id } });
    await Promise.all([removeFile(song.audioKey), removeFile(song.coverKey)]);
    refresh();
    return { ok: true };
  });
}

const KINDS = ["Video", "Interview", "Audio"] as const;

/** Adds a YouTube video (or live stream) to Artist Spotlight by link. */
export async function addVideo(input: { link: string; title: string; kind: string; blurb: string; live: boolean }): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const youtubeId = parseYouTubeId(input.link);
    if (!youtubeId) return { ok: false, error: "Paste a YouTube link, like https://youtu.be/… or a youtube.com/live/… link." };
    const title = str(input.title, 100);
    if (!title) return { ok: false, error: "Add a title." };
    const limit = await hit("video:" + artist.id, 30, 3600);
    if (!limit.ok) return { ok: false, error: `Too many videos at once. Try again in ${waitText(limit.retryAfterSec)}.` };
    const kind = input.live ? "Live" : (KINDS as readonly string[]).includes(input.kind) ? input.kind : "Video";
    if (input.live) await prisma.video.updateMany({ where: { artistId: artist.id, isLive: true }, data: { isLive: false } });
    const video = await prisma.video.create({ data: { artistId: artist.id, title, kind, youtubeId, isLive: !!input.live, blurb: text(input.blurb, 600) } });
    if (input.live) await notifyFollowers(artist.id, `${artist.name} is live`, title, `/spotlight/v-${video.id}`);
    refresh();
    return { ok: true };
  });
}

export async function endLive(videoId: string): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    await prisma.video.updateMany({ where: { id: str(videoId, 40), artistId: artist.id }, data: { isLive: false, kind: "Video" } });
    refresh();
    return { ok: true };
  });
}

export async function deleteVideo(videoId: string): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    await prisma.video.deleteMany({ where: { id: str(videoId, 40), artistId: artist.id } });
    refresh();
    return { ok: true };
  });
}

/** Direct upload to Brisic's YouTube channel (unlisted). Only when the YouTube API is configured. */
export async function startYouTubeVideo(input: { title: string; description: string; size: number; contentType: string }): Promise<Result<{ session: string }>> {
  return guard<{ session: string }>(async () => {
    const u = await me();
    if (u.creatorRole !== "artist" && u.creatorRole !== "podcaster") throw new Error("FORBIDDEN");
    if (!youtubeUploadEnabled()) return { ok: false, error: "Direct upload opens once Brisic's YouTube channel is connected. Paste a YouTube link for now." };
    if (!/^video\//.test(input.contentType) || !(input.size > 0) || input.size > 4 * 1024 ** 3) return { ok: false, error: "Use a video file under 4 GB." };
    const limit = await hit("ytupload:" + u.id, 10, 86400);
    if (!limit.ok) return { ok: false, error: `Upload limit reached. Try again in ${waitText(limit.retryAfterSec)}.` };
    const h = await headers();
    const origin = h.get("origin") || `https://${h.get("host")}`;
    const session = await startYouTubeUpload({ title: str(input.title, 100) || "Brisic video", description: text(input.description, 4900), size: input.size, contentType: input.contentType, origin });
    return { ok: true, session };
  });
}

export const youtubeUploadAvailable = async () => youtubeUploadEnabled();
export const storageAvailable = async () => storageMode() !== "off";

// ---------- Podcasters ----------

export async function createShow(input: { title: string; blurb: string; about: string; colorFrom: string; colorTo: string }): Promise<Result<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    const { userId } = await podcasterOnly();
    const title = str(input.title, 80);
    if (!title) return { ok: false, error: "Add the show name." };
    if ((await prisma.podcastShow.count({ where: { userId } })) >= 5) return { ok: false, error: "You can have up to 5 shows." };
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } });
    const color = (c: string, d: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : d);
    const show = await prisma.podcastShow.create({
      data: {
        id: await freeShowId(title), userId, title, host: u?.name || u?.username || "Host",
        blurb: str(input.blurb, 120), about: text(input.about, 1200),
        colorFrom: color(input.colorFrom, "#7a2a8a"), colorTo: color(input.colorTo, "#2a0f45"),
      },
    });
    refresh();
    return { ok: true, id: show.id };
  });
}

export async function addEpisode(input: { showId: string; title: string; description: string; minutes: number; link?: string; audioKey?: string | null; audioType?: string | null; live: boolean }): Promise<Result> {
  return guard(async () => {
    const { userId } = await podcasterOnly();
    const show = await prisma.podcastShow.findFirst({ where: { id: str(input.showId, 80), userId }, select: { id: true } });
    if (!show) return { ok: false, error: "Show not found." };
    const title = str(input.title, 100);
    if (!title) return { ok: false, error: "Add the episode title." };
    const youtubeId = input.link ? parseYouTubeId(input.link) : null;
    if (input.link && !youtubeId) return { ok: false, error: "That YouTube link doesn't look right." };
    let audioKey: string | null = null;
    if (input.audioKey) {
      if (!ownsKey(input.audioKey, `episodes/${show.id}`) || !(await exists(input.audioKey))) return { ok: false, error: "The audio upload did not finish. Try again." };
      audioKey = input.audioKey;
    }
    if (!youtubeId && !audioKey) return { ok: false, error: "Add a YouTube link or upload the audio." };
    const last = await prisma.podcastEpisode.findFirst({ where: { showId: show.id }, orderBy: { number: "desc" }, select: { number: true } });
    if (input.live) await prisma.podcastEpisode.updateMany({ where: { showId: show.id, isLive: true }, data: { isLive: false } });
    await prisma.podcastEpisode.create({
      data: {
        showId: show.id, number: (last?.number ?? 0) + 1, title, description: text(input.description, 2000),
        minutes: Math.max(0, Math.min(600, Math.round(Number(input.minutes) || 0))),
        youtubeId, audioKey, audioType: audioKey ? input.audioType : null, isLive: !!input.live && !!youtubeId,
      },
    });
    refresh();
    return { ok: true };
  });
}

export async function endEpisodeLive(episodeId: string): Promise<Result> {
  return guard(async () => {
    const { userId } = await podcasterOnly();
    await prisma.podcastEpisode.updateMany({ where: { id: str(episodeId, 40), show: { userId } }, data: { isLive: false } });
    refresh();
    return { ok: true };
  });
}

export async function deleteEpisode(episodeId: string): Promise<Result> {
  return guard(async () => {
    const { userId } = await podcasterOnly();
    const ep = await prisma.podcastEpisode.findFirst({ where: { id: str(episodeId, 40), show: { userId } }, select: { id: true, audioKey: true } });
    if (!ep) return { ok: false, error: "Episode not found." };
    await prisma.podcastEpisode.delete({ where: { id: ep.id } });
    await removeFile(ep.audioKey);
    refresh();
    return { ok: true };
  });
}

// ---------- Artists: edit songs, exclusives, merch ----------

export async function updateSong(input: { id: string; title: string; albumTitle: string; explicit: boolean; lyrics: string }): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const title = str(input.title, 100);
    if (!title) return { ok: false, error: "Add the song title." };
    const r = await prisma.song.updateMany({
      where: { id: str(input.id, 40), artistId: artist.id },
      data: { title, albumTitle: str(input.albumTitle, 100) || null, explicit: !!input.explicit, lyrics: text(input.lyrics, 8000) || null },
    });
    if (!r.count) return { ok: false, error: "Song not found." };
    refresh();
    return { ok: true };
  });
}

const EXCLUSIVE_KINDS = ["Song", "Video", "Story"] as const;

/** Fan-only content sold for B-Coins: a YouTube link (set the video to Unlisted) and/or an audio file. */
export async function addExclusive(input: { title: string; description: string; kind: string; price: number; link?: string; audioKey?: string | null; audioType?: string | null }): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const title = str(input.title, 100);
    if (!title) return { ok: false, error: "Add a title." };
    const price = Math.round(Number(input.price));
    if (!(price >= 10 && price <= 100_000)) return { ok: false, error: "Set a price between 10 and 100,000 B-Coins." };
    const youtubeId = input.link ? parseYouTubeId(input.link) : null;
    if (input.link && !youtubeId) return { ok: false, error: "That YouTube link doesn't look right." };
    let audioKey: string | null = null;
    if (input.audioKey) {
      if (!ownsKey(input.audioKey, `exclusives/${artist.id}`) || !(await exists(input.audioKey))) return { ok: false, error: "The audio upload did not finish. Try again." };
      if (!(UPLOAD_RULES.audio.types as readonly string[]).includes(String(input.audioType))) return { ok: false, error: "Unsupported audio file." };
      audioKey = input.audioKey;
    }
    if (!youtubeId && !audioKey) return { ok: false, error: "Add a YouTube link or upload the audio." };
    if ((await prisma.exclusive.count({ where: { artistId: artist.id } })) >= 50) return { ok: false, error: "You can have up to 50 exclusives." };
    const kind = (EXCLUSIVE_KINDS as readonly string[]).includes(input.kind) ? input.kind : youtubeId ? "Video" : "Song";
    await prisma.exclusive.create({ data: { artistId: artist.id, title, description: text(input.description, 600), kind, price, youtubeId, audioKey, audioType: audioKey ? String(input.audioType) : null } });
    await notifyFollowers(artist.id, `New exclusive from ${artist.name}`, title, `/artist/${artist.id}/exclusive`);
    refresh();
    return { ok: true };
  });
}

export async function deleteExclusive(id: string): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const x = await prisma.exclusive.findFirst({ where: { id: str(id, 40), artistId: artist.id }, select: { id: true, audioKey: true } });
    if (!x) return { ok: false, error: "Not found." };
    await prisma.exclusive.delete({ where: { id: x.id } });
    await removeFile(x.audioKey);
    refresh();
    return { ok: true };
  });
}

export async function addMerch(input: { name: string; priceNaira: number; description: string; buyUrl: string; imageKey?: string | null }): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const name = str(input.name, 80);
    if (!name) return { ok: false, error: "Name the item." };
    const priceNaira = Math.round(Number(input.priceNaira));
    if (!(priceNaira >= 100 && priceNaira <= 10_000_000)) return { ok: false, error: "Set a price in Naira (at least ₦100)." };
    let buyUrl: string | null = str(input.buyUrl, 300) || null;
    if (buyUrl) {
      try {
        const u = new URL(buyUrl.startsWith("http") ? buyUrl : `https://${buyUrl}`);
        if (u.protocol !== "https:" && u.protocol !== "http:") throw new Error("bad");
        buyUrl = u.toString();
      } catch {
        return { ok: false, error: "The buy link doesn't look like a web address." };
      }
    }
    if (input.imageKey && (!ownsKey(input.imageKey, `merch/${artist.id}`) || !(await exists(input.imageKey)))) return { ok: false, error: "The photo upload did not finish. Try again." };
    if ((await prisma.merchItem.count({ where: { artistId: artist.id } })) >= 60) return { ok: false, error: "You can list up to 60 items." };
    await prisma.merchItem.create({ data: { artistId: artist.id, name, priceNaira, description: text(input.description, 400), buyUrl, imageKey: input.imageKey || null } });
    refresh();
    return { ok: true };
  });
}

export async function deleteMerch(id: string): Promise<Result> {
  return guard(async () => {
    const { artist } = await artistOnly();
    const m = await prisma.merchItem.findFirst({ where: { id: str(id, 40), artistId: artist.id }, select: { id: true, imageKey: true } });
    if (!m) return { ok: false, error: "Not found." };
    await prisma.merchItem.delete({ where: { id: m.id } });
    await removeFile(m.imageKey);
    refresh();
    return { ok: true };
  });
}
