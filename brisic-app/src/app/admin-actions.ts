"use server";

// Admin-only actions: Brisic playlists for the Home shelves, featured listening parties and
// content moderation. Every action checks the caller's email against ADMIN_EMAILS.

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { isAdminEmail, slugify } from "@/lib/creators";
import { PALETTE } from "@/lib/catalog/home-data";
import { ART_CHOICES } from "@/lib/playlist-art";
import { FEATURED_PREFIX, newPartyCode } from "@/lib/party";
import { removeFile } from "@/lib/storage";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const str = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
const refresh = () => revalidatePath("/", "layout");

async function adminOnly() {
  const userId = await requireUserId();
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!isAdminEmail(u?.email)) throw new Error("FORBIDDEN");
  return userId;
}
const guard = async <T,>(fn: () => Promise<Result<T>>): Promise<Result<T>> => {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof Error && e.message === "FORBIDDEN") return { ok: false, error: "Only Brisic admins can do this." };
    throw e;
  }
};

// ---------- Brisic playlists ----------

type PlaylistInput = { title: string; subtitle: string; shelf: string; color: string; hero: string };

function clean(input: PlaylistInput): Result<{ data: { title: string; subtitle: string; shelf: string; artFrom: string; artTo: string; hero: string | null } }> {
  const title = str(input.title, 60);
  if (!title) return { ok: false, error: "Give the playlist a name." };
  const shelf = str(input.shelf, 40);
  if (!shelf) return { ok: false, error: "Pick the Home shelf it goes in." };
  const color = PALETTE.find((c) => c.name === input.color) ?? PALETTE[0];
  const hero = ART_CHOICES.some((a) => a.id === input.hero) ? input.hero : null;
  return { ok: true, data: { title, subtitle: str(input.subtitle, 80), shelf, artFrom: color.from, artTo: color.to, hero } };
}

export async function createEditorialPlaylist(input: PlaylistInput): Promise<Result<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    await adminOnly();
    const c = clean(input);
    if (!c.ok) return c;
    const base = "pl-" + slugify(c.data.title);
    let id = base;
    for (let n = 2; await prisma.editorialPlaylist.findUnique({ where: { id }, select: { id: true } }); n++) id = `${base}-${n}`;
    const last = await prisma.editorialPlaylist.findFirst({ where: { shelf: c.data.shelf }, orderBy: { position: "desc" }, select: { position: true } });
    await prisma.editorialPlaylist.create({ data: { id, ...c.data, position: (last?.position ?? -1) + 1 } });
    refresh();
    return { ok: true, id };
  });
}

export async function updateEditorialPlaylist(id: string, input: PlaylistInput): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    const c = clean(input);
    if (!c.ok) return c;
    await prisma.editorialPlaylist.update({ where: { id: str(id, 80) }, data: c.data });
    refresh();
    return { ok: true };
  });
}

export async function deleteEditorialPlaylist(id: string): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    await prisma.editorialPlaylist.deleteMany({ where: { id: str(id, 80) } });
    refresh();
    return { ok: true };
  });
}

/** Moves a playlist left/right within its Home shelf. */
export async function moveEditorialPlaylist(id: string, dir: -1 | 1): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    const p = await prisma.editorialPlaylist.findUnique({ where: { id: str(id, 80) }, select: { id: true, shelf: true } });
    if (!p) return { ok: false, error: "Playlist not found." };
    const list = await prisma.editorialPlaylist.findMany({ where: { shelf: p.shelf }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: { id: true } });
    const i = list.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return { ok: true };
    [list[i], list[j]] = [list[j], list[i]];
    await prisma.$transaction(list.map((x, k) => prisma.editorialPlaylist.update({ where: { id: x.id }, data: { position: k } })));
    refresh();
    return { ok: true };
  });
}

/** Songs on Brisic matching a title or artist, for adding to a playlist. */
export async function adminFindSongs(query: string) {
  await adminOnly();
  const q = str(query, 80);
  const has = { contains: q, mode: "insensitive" as const };
  const rows = await prisma.song.findMany({
    where: q ? { OR: [{ title: has }, { artist: { name: has } }, { albumTitle: has }] } : {},
    orderBy: q ? { plays: "desc" } : { createdAt: "desc" },
    take: 20,
    select: { id: true, title: true, durationSec: true, plays: true, artist: { select: { name: true } } },
  });
  return rows.map((s) => ({ id: s.id, title: s.title, artistName: s.artist.name, durationSec: s.durationSec, plays: s.plays }));
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    const pid = str(playlistId, 80);
    const sid = str(songId, 40);
    const [p, s] = await Promise.all([
      prisma.editorialPlaylist.findUnique({ where: { id: pid }, select: { id: true, _count: { select: { songs: true } } } }),
      prisma.song.findUnique({ where: { id: sid }, select: { id: true } }),
    ]);
    if (!p || !s) return { ok: false, error: "Song or playlist not found." };
    if (p._count.songs >= 200) return { ok: false, error: "A playlist can have up to 200 songs." };
    const last = await prisma.editorialPlaylistSong.findFirst({ where: { playlistId: pid }, orderBy: { position: "desc" }, select: { position: true } });
    await prisma.editorialPlaylistSong.upsert({
      where: { playlistId_songId: { playlistId: pid, songId: sid } },
      create: { playlistId: pid, songId: sid, position: (last?.position ?? -1) + 1 },
      update: {},
    });
    refresh();
    return { ok: true };
  });
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    await prisma.editorialPlaylistSong.deleteMany({ where: { playlistId: str(playlistId, 80), songId: str(songId, 40) } });
    refresh();
    return { ok: true };
  });
}

export async function moveSongInPlaylist(playlistId: string, songId: string, dir: -1 | 1): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    const pid = str(playlistId, 80);
    const list = await prisma.editorialPlaylistSong.findMany({ where: { playlistId: pid }, orderBy: { position: "asc" }, select: { songId: true } });
    const i = list.findIndex((x) => x.songId === songId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return { ok: true };
    [list[i], list[j]] = [list[j], list[i]];
    await prisma.$transaction(list.map((x, k) => prisma.editorialPlaylistSong.update({ where: { playlistId_songId: { playlistId: pid, songId: x.songId } }, data: { position: k } })));
    refresh();
    return { ok: true };
  });
}

// ---------- Featured listening parties ----------

/** A room featured on Home under "Join a Party". It stays open until an admin ends it. */
export async function createFeaturedParty(name: string): Promise<Result<{ code: string }>> {
  return guard<{ code: string }>(async () => {
    await adminOnly();
    const title = str(name, 40);
    if (!title) return { ok: false, error: "Name the party, like Friday Night Vibes." };
    for (let i = 0; i < 5; i++) {
      try {
        const code = newPartyCode();
        await prisma.partyRoom.create({
          data: { code, name: title, featureKey: FEATURED_PREFIX + slugify(title) + "-" + Date.now().toString(36), hostId: null, isPublic: true, chatOpen: true },
        });
        refresh();
        return { ok: true, code };
      } catch {
        // code clash: try another
      }
    }
    return { ok: false, error: "Could not create the party. Try again." };
  });
}

export async function endFeaturedParty(code: string): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    await prisma.partyRoom.updateMany({ where: { code: str(code, 20), featureKey: { startsWith: FEATURED_PREFIX } }, data: { endedAt: new Date() } });
    refresh();
    return { ok: true };
  });
}

// ---------- Moderation ----------

/** Takes any song, video, exclusive, merch item or podcast episode off Brisic. */
export async function adminRemoveContent(kind: "song" | "video" | "episode" | "exclusive" | "merch", id: string): Promise<Result> {
  return guard(async () => {
    await adminOnly();
    const key = str(id, 40);
    if (kind === "song") {
      const s = await prisma.song.findUnique({ where: { id: key }, select: { audioKey: true, coverKey: true } });
      if (s) { await prisma.song.delete({ where: { id: key } }); await Promise.all([removeFile(s.audioKey), removeFile(s.coverKey)]); }
    } else if (kind === "video") {
      await prisma.video.deleteMany({ where: { id: key } });
    } else if (kind === "episode") {
      const e = await prisma.podcastEpisode.findUnique({ where: { id: key }, select: { audioKey: true } });
      if (e) { await prisma.podcastEpisode.delete({ where: { id: key } }); await removeFile(e.audioKey); }
    } else if (kind === "exclusive") {
      const x = await prisma.exclusive.findUnique({ where: { id: key }, select: { audioKey: true } });
      if (x) { await prisma.exclusive.delete({ where: { id: key } }); await removeFile(x.audioKey); }
    } else if (kind === "merch") {
      const m = await prisma.merchItem.findUnique({ where: { id: key }, select: { imageKey: true } });
      if (m) { await prisma.merchItem.delete({ where: { id: key } }); await removeFile(m.imageKey); }
    }
    refresh();
    return { ok: true };
  });
}
