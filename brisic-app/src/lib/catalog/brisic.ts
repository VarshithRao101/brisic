// Brisic's own catalog: everything comes from the database. Songs, albums, videos, lives and
// podcasts are uploaded by invited creators; playlists, Home shelves and featured parties are made
// by admins. There is no sample content: a screen with nothing real on it shows an empty state.

import { prisma } from "@/lib/prisma";
import { GENRES } from "./genres";
import { SHELVES, isLargeShelf } from "./home-data";
import type {
  Album, Artist, CatalogProvider, Episode, HomeSection, Playlist, SearchResults, Show, SpotlightItem, Station, Track, TrackDetails,
} from "./types";

const SONG = "s-"; // track ids for uploaded songs
const VIDEO = "v-"; // spotlight ids for creator videos
const EPISODE = "e-"; // episode ids for creator podcasts
const ALBUM = "al-"; // album ids: al-<artistId>.<album-slug>

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
const strip = (id: string, prefix: string) => (id.startsWith(prefix) ? id.slice(prefix.length) : null);
const albumId = (artistId: string, title: string) => `${ALBUM}${artistId}.${slug(title)}`;
const DAY = 86_400_000;

// ---------- Songs ----------

const songSelect = {
  id: true, title: true, albumTitle: true, durationSec: true, coverKey: true, explicit: true, plays: true, createdAt: true,
  artist: { select: { id: true, name: true } },
} as const;
type SongRow = { id: string; title: string; albumTitle: string | null; durationSec: number; coverKey: string | null; explicit: boolean; plays: number; createdAt: Date; artist: { id: string; name: string } };

const toTrack = (s: SongRow): Track => ({
  id: SONG + s.id,
  title: s.title,
  artistId: s.artist.id,
  artistName: s.artist.name,
  albumId: s.albumTitle ? albumId(s.artist.id, s.albumTitle) : null,
  albumTitle: s.albumTitle,
  durationSec: s.durationSec,
  streams: s.plays,
  streamUrl: `/api/media/song/${s.id}`,
  artwork: s.coverKey ? `/api/media/cover/${s.id}` : null,
  explicit: s.explicit,
});

/** Albums and EPs, grouped from the album title the artist typed on each song. */
function albumsOf(songs: SongRow[]): Album[] {
  const map = new Map<string, Album & { first: Date }>();
  for (const s of [...songs].sort((a, b) => +a.createdAt - +b.createdAt)) {
    if (!s.albumTitle) continue;
    const id = albumId(s.artist.id, s.albumTitle);
    const a = map.get(id);
    if (a) {
      a.trackCount++;
      if (!a.artwork && s.coverKey) a.artwork = `/api/media/cover/${s.id}`;
    } else {
      map.set(id, {
        id, title: s.albumTitle, artistId: s.artist.id, artistName: s.artist.name, year: s.createdAt.getFullYear(), trackCount: 1,
        artwork: s.coverKey ? `/api/media/cover/${s.id}` : null, first: s.createdAt,
      });
    }
  }
  return [...map.values()].sort((a, b) => +b.first - +a.first).map(({ first, ...a }) => (void first, a));
}

// ---------- Artists ----------

type ArtistRow = { id: string; name: string; genre: string; bio: string; imageKey: string | null };
const artistSelect = { id: true, name: true, genre: true, bio: true, imageKey: true } as const;

/** Distinct listeners in the last 30 days, per artist (from play history). */
async function monthlyListeners(artistIds: string[]) {
  const out = new Map<string, number>();
  if (!artistIds.length) return out;
  const rows = await prisma.playHistory.groupBy({
    by: ["artistId", "userId"],
    where: { artistId: { in: artistIds }, playedAt: { gte: new Date(Date.now() - 30 * DAY) } },
  });
  for (const r of rows) out.set(r.artistId, (out.get(r.artistId) ?? 0) + 1);
  return out;
}

const toArtist = (a: ArtistRow, listeners: number, plays?: number): Artist => ({
  id: a.id, name: a.name, genre: a.genre, bio: a.bio || `${a.name} on Brisic.`, monthlyListeners: listeners,
  image: a.imageKey ? `/api/media/artist/${a.id}` : null, plays,
});

async function withListeners(rows: ArtistRow[]) {
  const listeners = await monthlyListeners(rows.map((a) => a.id));
  return rows.map((a) => toArtist(a, listeners.get(a.id) ?? 0));
}

// ---------- Videos, podcasts ----------

const videoSelect = { id: true, title: true, kind: true, youtubeId: true, isLive: true, blurb: true, durationSec: true, views: true, artist: { select: { id: true, name: true } } } as const;
type VideoRow = { id: string; title: string; kind: string; youtubeId: string; isLive: boolean; blurb: string; durationSec: number; views: number; artist: { id: string; name: string } };
const toSpotlight = (v: VideoRow): SpotlightItem => ({
  id: VIDEO + v.id, artistId: v.artist.id, artistName: v.artist.name, title: v.title,
  kind: v.isLive ? "Live" : (["Video", "Audio", "Live", "Interview"].includes(v.kind) ? v.kind : "Video") as SpotlightItem["kind"],
  durationSec: v.durationSec, views: v.views, blurb: v.blurb, mediaUrl: null, poster: null, youtubeId: v.youtubeId, isLive: v.isLive,
});

const showSelect = { id: true, title: true, host: true, blurb: true, about: true, colorFrom: true, colorTo: true, _count: { select: { episodes: true } } } as const;
type ShowRow = { id: string; title: string; host: string; blurb: string; about: string; colorFrom: string; colorTo: string; _count: { episodes: number } };
const toShow = (s: ShowRow): Show => ({
  id: s.id, title: s.title, host: s.host, blurb: s.blurb, about: s.about || s.blurb, episodeCount: s._count.episodes, colors: [s.colorFrom, s.colorTo],
});

const episodeSelect = { id: true, number: true, title: true, description: true, minutes: true, youtubeId: true, audioKey: true, isLive: true, show: { select: { id: true, title: true } } } as const;
type EpisodeRow = { id: string; number: number; title: string; description: string; minutes: number; youtubeId: string | null; audioKey: string | null; isLive: boolean; show: { id: string; title: string } };
const toEpisode = (e: EpisodeRow): Episode => ({
  id: EPISODE + e.id, showId: e.show.id, showTitle: e.show.title, number: e.number, title: e.title, minutes: e.minutes,
  description: e.description, mediaUrl: e.audioKey ? `/api/media/episode/${e.id}` : null, youtubeId: e.youtubeId, isLive: e.isLive,
});

// ---------- Brisic playlists (made by admins) ----------

type PlaylistRow = { id: string; title: string; subtitle: string; shelf: string; artFrom: string; artTo: string; hero: string | null; _count: { songs: number } };
const playlistSelect = { id: true, title: true, subtitle: true, shelf: true, artFrom: true, artTo: true, hero: true, _count: { select: { songs: true } } } as const;
const toPlaylist = (p: PlaylistRow): Playlist => {
  const large = isLargeShelf(p.shelf);
  const words = p.title.toUpperCase().split(/\s+/);
  return {
    id: p.id, title: p.title, subtitle: p.subtitle || `${p._count.songs} songs`, trackCount: p._count.songs, artwork: null, hero: p.hero,
    art: large
      ? { from: p.artFrom, to: p.artTo, angle: 160, label: p.title.replace(" ", "\n"), ink: "#fff6ee", soft: true, figure: "stars", pfill: "#0a0a12", px: 90 }
      : { from: p.artFrom, to: p.artTo, label: words.length > 3 ? words.slice(0, 3).join("\n") : words.join("\n") },
  };
};
const showCard = (s: Show): Playlist => ({
  id: s.id, title: s.title, subtitle: s.host, trackCount: s.episodeCount, artwork: null, href: `/shows/${s.id}`,
  art: { from: s.colors?.[0] ?? "#7a2a8a", to: s.colors?.[1] ?? "#2a0f45", label: s.title.toUpperCase().split(/\s+/).slice(0, 3).join("\n") },
});

/** Songs by genre (the artist's main genre), most played first. */
const songsInGenre = (name: string, take: number) =>
  prisma.song.findMany({ where: { artist: { genre: { equals: name, mode: "insensitive" } } }, orderBy: [{ plays: "desc" }, { createdAt: "desc" }], take, select: songSelect });

async function homeSections(): Promise<HomeSection[]> {
  const [fresh, playlists, shows, videoCount] = await Promise.all([
    prisma.song.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: songSelect }),
    prisma.editorialPlaylist.findMany({ where: { songs: { some: {} } }, orderBy: [{ position: "asc" }, { createdAt: "asc" }], select: playlistSelect }),
    prisma.podcastShow.findMany({ where: { episodes: { some: {} } }, orderBy: { createdAt: "desc" }, take: 12, select: showSelect }),
    prisma.video.count(),
  ]);
  const out: HomeSection[] = [];
  if (fresh.length) out.push({ id: "new-on-brisic", title: "New on Brisic", kind: "tracks", playlists: [], tracks: fresh.map(toTrack) });
  const byShelf = new Map<string, Playlist[]>();
  for (const p of playlists) byShelf.set(p.shelf, [...(byShelf.get(p.shelf) ?? []), toPlaylist(p)]);
  for (const s of SHELVES) {
    const id = slug(s.title);
    if (s.kind === "podcasts") { if (shows.length) out.push({ id, title: s.title, kind: "podcasts", playlists: shows.map(toShow).map(showCard) }); continue; }
    if (s.kind === "parties") { out.push({ id, title: s.title, kind: "parties", playlists: [] }); continue; }
    if (s.kind === "spotlight") { if (videoCount) out.push({ id, title: s.title, kind: "spotlight", playlists: [] }); continue; }
    const list = byShelf.get(s.title);
    if (list?.length) out.push({ id, title: s.title, kind: s.kind, playlists: list });
    byShelf.delete(s.title);
  }
  // Shelves an admin named themselves go after the standard ones.
  for (const [title, list] of byShelf) out.push({ id: slug(title), title, kind: isLargeShelf(title) ? "large" : "playlists", playlists: list });
  return out;
}

function parseLyrics(text: string | null): TrackDetails["lyrics"] {
  if (!text) return [];
  const out: TrackDetails["lyrics"] = [];
  let section: string | undefined;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const head = /^\[(.{1,40})\]$/.exec(line);
    if (head) { section = head[1]; continue; }
    if (!line) continue;
    out.push(section ? { section, text: line } : { text: line });
    section = undefined;
  }
  return out;
}

export const brisicCatalog: CatalogProvider = {
  isSample: false,

  getHomeSections: homeSections,

  async getSection(id) {
    const sections = await homeSections();
    return sections.find((s) => s.id === id) ?? null;
  },

  async getTrendingArtists(period) {
    const since = new Date(Date.now() - (period === "week" ? 7 : 30) * DAY);
    const rows = await prisma.artistProfile.findMany({
      where: { songs: { some: {} } }, take: 100,
      select: { ...artistSelect, songs: { select: { plays: true } } },
    });
    if (!rows.length) return [];
    const [inWindow, listeners] = await Promise.all([
      prisma.playHistory.groupBy({ by: ["artistId"], where: { artistId: { in: rows.map((a) => a.id) }, playedAt: { gte: since } }, _count: { _all: true } }),
      monthlyListeners(rows.map((a) => a.id)),
    ]);
    const plays = new Map(inWindow.map((r) => [r.artistId, r._count._all]));
    const total = (a: (typeof rows)[number]) => a.songs.reduce((n, s) => n + s.plays, 0);
    return rows
      .sort((a, b) => (plays.get(b.id) ?? 0) - (plays.get(a.id) ?? 0) || total(b) - total(a))
      .map((a) => toArtist(a, listeners.get(a.id) ?? 0, plays.get(a.id) ?? 0));
  },

  async getArtist(id) {
    const a = await prisma.artistProfile.findUnique({
      where: { id },
      select: { ...artistSelect, songs: { orderBy: [{ plays: "desc" }, { createdAt: "desc" }], take: 200, select: songSelect } },
    });
    if (!a) return null;
    const listeners = await monthlyListeners([a.id]);
    return { artist: toArtist(a, listeners.get(a.id) ?? 0), topTracks: a.songs.slice(0, 50).map(toTrack), albums: albumsOf(a.songs) };
  },

  async getAlbum(id) {
    const rest = strip(id, ALBUM);
    const dot = rest?.lastIndexOf(".") ?? -1;
    if (!rest || dot < 1) return null;
    const artistId = rest.slice(0, dot);
    const songs = await prisma.song.findMany({ where: { artistId, albumTitle: { not: null } }, orderBy: { createdAt: "asc" }, select: songSelect });
    const inAlbum = songs.filter((s) => albumId(s.artist.id, s.albumTitle!) === id);
    const album = albumsOf(inAlbum)[0];
    return album ? { album, tracks: inAlbum.map(toTrack) } : null;
  },

  async getPlaylist(id) {
    const p = await prisma.editorialPlaylist.findUnique({
      where: { id },
      select: { ...playlistSelect, songs: { orderBy: { position: "asc" }, select: { song: { select: songSelect } } } },
    });
    if (!p) return null;
    return { playlist: toPlaylist(p), tracks: p.songs.map((x) => toTrack(x.song)) };
  },

  async getGenres() { return GENRES; },

  async getGenre(id) {
    const genre = GENRES.find((g) => g.id === id);
    if (!genre) return null;
    const [songs, artists, playlists] = await Promise.all([
      songsInGenre(genre.name, 30),
      prisma.artistProfile.findMany({ where: { genre: { equals: genre.name, mode: "insensitive" }, songs: { some: {} } }, take: 12, select: artistSelect }),
      prisma.editorialPlaylist.findMany({
        where: { songs: { some: {} }, OR: [{ title: { contains: genre.name, mode: "insensitive" } }, { shelf: { contains: genre.name, mode: "insensitive" } }] },
        take: 8, select: playlistSelect,
      }),
    ]);
    return { genre, tracks: songs.map(toTrack), artists: await withListeners(artists), playlists: playlists.map(toPlaylist) };
  },

  async getStations() {
    // One radio station per music genre that has songs.
    const rows = await prisma.artistProfile.findMany({ where: { songs: { some: {} } }, select: { genre: true, _count: { select: { songs: true } } } });
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.genre.toLowerCase(), (counts.get(r.genre.toLowerCase()) ?? 0) + r._count.songs);
    return GENRES.filter((g) => g.group === "music" && counts.has(g.name.toLowerCase())).map(
      (g): Station => ({ id: "st-" + g.id, name: g.name, subtitle: `${counts.get(g.name.toLowerCase())} songs · ${g.blurb}` }),
    );
  },

  async getStationTracks(id) {
    const g = GENRES.find((x) => "st-" + x.id === id);
    if (!g) return [];
    return (await songsInGenre(g.name, 60)).map(toTrack);
  },

  async getTrackDetails(id) {
    const own = strip(id, SONG);
    if (!own) return null;
    const s = await prisma.song.findUnique({ where: { id: own }, select: { albumTitle: true, lyrics: true, createdAt: true, artist: { select: { name: true } } } });
    if (!s) return null;
    return {
      lyrics: parseLyrics(s.lyrics),
      credits: [
        { label: "Performed by", value: s.artist.name },
        { label: "Album", value: s.albumTitle || "Single" },
        { label: "Released", value: s.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + " on Brisic" },
      ],
    };
  },

  async getTracksByIds(ids) {
    const own = ids.map((i) => strip(i, SONG)).filter((x): x is string => !!x);
    if (!own.length) return [];
    const rows = await prisma.song.findMany({ where: { id: { in: own } }, select: songSelect });
    const byId = new Map(rows.map(toTrack).map((t) => [t.id, t]));
    return ids.map((i) => byId.get(i)).filter((t): t is Track => !!t);
  },

  async search(query): Promise<SearchResults> {
    const q = query.trim();
    if (!q) return { tracks: [], artists: [], albums: [], playlists: [], shows: [] };
    const has = { contains: q, mode: "insensitive" as const };
    const [songs, artists, albumSongs, playlists, shows] = await Promise.all([
      prisma.song.findMany({ where: { OR: [{ title: has }, { artist: { name: has } }] }, orderBy: { plays: "desc" }, take: 20, select: songSelect }),
      prisma.artistProfile.findMany({ where: { OR: [{ name: has }, { genre: has }] }, take: 12, select: artistSelect }),
      prisma.song.findMany({ where: { albumTitle: has }, take: 60, select: songSelect }),
      prisma.editorialPlaylist.findMany({ where: { songs: { some: {} }, OR: [{ title: has }, { subtitle: has }] }, take: 8, select: playlistSelect }),
      prisma.podcastShow.findMany({ where: { episodes: { some: {} }, OR: [{ title: has }, { host: has }, { blurb: has }] }, take: 6, select: showSelect }),
    ]);
    return {
      tracks: songs.map(toTrack),
      artists: await withListeners(artists),
      albums: albumsOf(albumSongs).slice(0, 8),
      playlists: playlists.map(toPlaylist),
      shows: shows.map(toShow),
    };
  },

  async suggest(prompt) {
    const p = prompt.toLowerCase();
    if (!(await prisma.song.count())) return { reply: "There's no music on Brisic yet. Artists are uploading now, so check back soon.", tracks: [] };
    const mood: [RegExp, string[]][] = [
      [/chill|relax|calm|sleep|slow/, ["R&B", "Soul", "Lo-fi", "Jazz"]],
      [/party|dance|hype|workout|gym/, ["Afrobeats", "Afro-pop", "Amapiano", "Dancehall"]],
      [/worship|gospel|praise|pray/, ["Gospel"]],
      [/rap|bars|hip.?hop|trap/, ["Hip-Hop", "Trap"]],
    ];
    const genre = GENRES.find((g) => g.group === "music" && p.includes(g.name.toLowerCase()));
    const names = genre ? [genre.name] : mood.find(([re]) => re.test(p))?.[1];
    if (names) {
      const songs = await prisma.song.findMany({ where: { OR: names.map((n) => ({ artist: { genre: { equals: n, mode: "insensitive" as const } } })) }, orderBy: { plays: "desc" }, take: 8, select: songSelect });
      if (songs.length) return { reply: genre ? `Here are some ${genre.name} picks.` : "Here's a mix for that mood.", tracks: songs.map(toTrack) };
    }
    const words = p.split(/\W+/).filter((w) => w.length > 2);
    if (words.length) {
      const songs = await prisma.song.findMany({
        where: { OR: words.flatMap((w) => [{ title: { contains: w, mode: "insensitive" as const } }, { artist: { name: { contains: w, mode: "insensitive" as const } } }]) },
        orderBy: { plays: "desc" }, take: 8, select: songSelect,
      });
      if (songs.length) return { reply: "Here's what I found on Brisic.", tracks: songs.map(toTrack) };
    }
    const top = await prisma.song.findMany({ orderBy: [{ plays: "desc" }, { createdAt: "desc" }], take: 8, select: songSelect });
    return { reply: "Here are the top songs on Brisic right now.", tracks: top.map(toTrack) };
  },

  async getSpotlight() {
    const rows = await prisma.video.findMany({ orderBy: [{ isLive: "desc" }, { createdAt: "desc" }], take: 60, select: videoSelect });
    return rows.map(toSpotlight);
  },

  async getSpotlightItem(id) {
    const own = strip(id, VIDEO);
    if (!own) return null;
    const v = await prisma.video.findUnique({ where: { id: own }, select: videoSelect });
    if (!v) return null;
    const more = await prisma.video.findMany({ where: { id: { not: own } }, orderBy: { createdAt: "desc" }, take: 6, select: videoSelect });
    // Count the view (best effort).
    prisma.video.update({ where: { id: own }, data: { views: { increment: 1 } } }).catch(() => {});
    return { item: toSpotlight(v), more: more.map(toSpotlight) };
  },

  async getShows() {
    const rows = await prisma.podcastShow.findMany({ where: { episodes: { some: {} } }, orderBy: { createdAt: "desc" }, take: 50, select: showSelect });
    return rows.map(toShow);
  },

  async getShow(id) {
    const s = await prisma.podcastShow.findUnique({ where: { id }, select: { ...showSelect, episodes: { orderBy: { number: "asc" }, select: episodeSelect } } });
    return s ? { show: toShow(s), episodes: s.episodes.map(toEpisode) } : null;
  },

  async getEpisode(id) {
    const own = strip(id, EPISODE);
    if (!own) return null;
    const e = await prisma.podcastEpisode.findUnique({ where: { id: own }, select: { ...episodeSelect, show: { select: showSelect } } });
    if (!e) return null;
    const siblings = await prisma.podcastEpisode.findMany({ where: { showId: e.show.id, id: { not: own } }, orderBy: { number: "desc" }, take: 10, select: episodeSelect });
    return { episode: toEpisode({ ...e, show: { id: e.show.id, title: e.show.title } }), show: toShow(e.show), more: siblings.map(toEpisode) };
  },
};
