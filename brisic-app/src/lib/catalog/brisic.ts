// Brisic's own catalog: songs, videos, lives and podcasts uploaded by invited creators, stored in
// Postgres (files in object storage). Real content comes first; the sample catalog fills the
// rest of each screen until there is enough real music.

import { prisma } from "@/lib/prisma";
import { mockCatalog } from "./mock";
import type { Artist, CatalogProvider, Episode, SearchResults, Show, SpotlightItem, Track } from "./types";

const SONG = "s-"; // track ids for uploaded songs
const VIDEO = "v-"; // spotlight ids for creator videos
const EPISODE = "e-"; // episode ids for creator podcasts

type SongRow = { id: string; title: string; albumTitle: string | null; durationSec: number; coverKey: string | null; explicit: boolean; plays: number; artist: { id: string; name: string } };
const songSelect = { id: true, title: true, albumTitle: true, durationSec: true, coverKey: true, explicit: true, plays: true, artist: { select: { id: true, name: true } } } as const;

const toTrack = (s: SongRow): Track => ({
  id: SONG + s.id,
  title: s.title,
  artistId: s.artist.id,
  artistName: s.artist.name,
  albumId: null,
  albumTitle: s.albumTitle,
  durationSec: s.durationSec,
  streams: s.plays,
  streamUrl: `/api/media/song/${s.id}`,
  artwork: s.coverKey ? `/api/media/cover/${s.id}` : null,
  explicit: s.explicit,
});

/** Distinct listeners in the last 30 days, per creator artist (from play history). */
async function monthlyListeners(artistIds: string[]) {
  if (!artistIds.length) return new Map<string, number>();
  const rows = await prisma.playHistory.groupBy({
    by: ["artistId", "userId"],
    where: { artistId: { in: artistIds }, playedAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
  });
  const out = new Map<string, number>();
  for (const r of rows) out.set(r.artistId, (out.get(r.artistId) ?? 0) + 1);
  return out;
}

type ArtistRow = { id: string; name: string; genre: string; bio: string; imageKey: string | null };
const toArtist = (a: ArtistRow, listeners: number): Artist => ({
  id: a.id, name: a.name, genre: a.genre, bio: a.bio || `${a.name} on Brisic.`, monthlyListeners: listeners,
  image: a.imageKey ? `/api/media/artist/${a.id}` : null,
});

type VideoRow = { id: string; title: string; kind: string; youtubeId: string; isLive: boolean; blurb: string; durationSec: number; views: number; artist: { id: string; name: string } };
const toSpotlight = (v: VideoRow): SpotlightItem => ({
  id: VIDEO + v.id, artistId: v.artist.id, artistName: v.artist.name, title: v.title,
  kind: v.isLive ? "Live" : (["Video", "Audio", "Live", "Interview"].includes(v.kind) ? v.kind : "Video") as SpotlightItem["kind"],
  durationSec: v.durationSec, views: v.views, blurb: v.blurb, mediaUrl: null, poster: null, youtubeId: v.youtubeId, isLive: v.isLive,
});
const videoSelect = { id: true, title: true, kind: true, youtubeId: true, isLive: true, blurb: true, durationSec: true, views: true, artist: { select: { id: true, name: true } } } as const;

type ShowRow = { id: string; title: string; host: string; blurb: string; about: string; colorFrom: string; colorTo: string; _count: { episodes: number } };
const toShow = (s: ShowRow): Show => ({
  id: s.id, title: s.title, host: s.host, blurb: s.blurb, about: s.about || s.blurb, episodeCount: s._count.episodes, colors: [s.colorFrom, s.colorTo],
});
const showSelect = { id: true, title: true, host: true, blurb: true, about: true, colorFrom: true, colorTo: true, _count: { select: { episodes: true } } } as const;

type EpisodeRow = { id: string; number: number; title: string; description: string; minutes: number; youtubeId: string | null; audioKey: string | null; isLive: boolean; show: { id: string; title: string } };
const toEpisode = (e: EpisodeRow): Episode => ({
  id: EPISODE + e.id, showId: e.show.id, showTitle: e.show.title, number: e.number, title: e.title, minutes: e.minutes,
  description: e.description, mediaUrl: e.audioKey ? `/api/media/episode/${e.id}` : null, youtubeId: e.youtubeId, isLive: e.isLive,
});
const episodeSelect = { id: true, number: true, title: true, description: true, minutes: true, youtubeId: true, audioKey: true, isLive: true, show: { select: { id: true, title: true } } } as const;

const strip = (id: string, prefix: string) => (id.startsWith(prefix) ? id.slice(prefix.length) : null);

export const brisicCatalog: CatalogProvider = {
  ...mockCatalog,

  async getHomeSections() {
    const [sample, fresh] = await Promise.all([
      mockCatalog.getHomeSections(),
      prisma.song.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: songSelect }),
    ]);
    if (!fresh.length) return sample;
    return [{ id: "new-on-brisic", title: "New on Brisic", kind: "tracks" as const, playlists: [], tracks: fresh.map(toTrack) }, ...sample];
  },

  async getTrendingArtists(period) {
    const [sample, real] = await Promise.all([
      mockCatalog.getTrendingArtists(period),
      prisma.artistProfile.findMany({ where: { songs: { some: {} } }, take: 50, select: { id: true, name: true, genre: true, bio: true, imageKey: true } }),
    ]);
    const listeners = await monthlyListeners(real.map((a) => a.id));
    const mine = real.map((a) => toArtist(a, listeners.get(a.id) ?? 0)).sort((x, y) => y.monthlyListeners - x.monthlyListeners);
    return [...mine, ...sample];
  },

  async getArtist(id) {
    const a = await prisma.artistProfile.findUnique({
      where: { id },
      select: { id: true, name: true, genre: true, bio: true, imageKey: true, songs: { orderBy: [{ plays: "desc" }, { createdAt: "desc" }], take: 50, select: songSelect } },
    });
    if (!a) return mockCatalog.getArtist(id);
    const listeners = await monthlyListeners([a.id]);
    return { artist: toArtist(a, listeners.get(a.id) ?? 0), topTracks: a.songs.map(toTrack), albums: [] };
  },

  async getTracksByIds(ids) {
    const own = ids.map((i) => strip(i, SONG)).filter((x): x is string => !!x);
    const [rows, sample] = await Promise.all([
      own.length ? prisma.song.findMany({ where: { id: { in: own } }, select: songSelect }) : [],
      mockCatalog.getTracksByIds(ids.filter((i) => !i.startsWith(SONG))),
    ]);
    const byId = new Map([...rows.map(toTrack), ...sample].map((t) => [t.id, t]));
    return ids.map((i) => byId.get(i)).filter((t): t is Track => !!t);
  },

  async getTrackDetails(id) {
    const own = strip(id, SONG);
    if (!own) return mockCatalog.getTrackDetails(id);
    const s = await prisma.song.findUnique({ where: { id: own }, select: { albumTitle: true, artist: { select: { name: true } } } });
    if (!s) return null;
    return {
      lyrics: [],
      credits: [
        { label: "Performed by", value: s.artist.name },
        { label: "Album", value: s.albumTitle || "Single" },
        { label: "Released on", value: "Brisic" },
      ],
    };
  },

  async search(query): Promise<SearchResults> {
    const q = query.trim();
    const sample = await mockCatalog.search(q);
    if (!q) return sample;
    const [songs, artists] = await Promise.all([
      prisma.song.findMany({ where: { OR: [{ title: { contains: q, mode: "insensitive" } }, { artist: { name: { contains: q, mode: "insensitive" } } }] }, take: 12, select: songSelect }),
      prisma.artistProfile.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 8, select: { id: true, name: true, genre: true, bio: true, imageKey: true } }),
    ]);
    const listeners = await monthlyListeners(artists.map((a) => a.id));
    return {
      ...sample,
      tracks: [...songs.map(toTrack), ...sample.tracks].slice(0, 20),
      artists: [...artists.map((a) => toArtist(a, listeners.get(a.id) ?? 0)), ...sample.artists].slice(0, 12),
    };
  },

  async suggest(prompt) {
    const words = prompt.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    const sample = await mockCatalog.suggest(prompt);
    if (!words.length) return sample;
    const songs = await prisma.song.findMany({
      where: { OR: words.flatMap((w) => [{ title: { contains: w, mode: "insensitive" as const } }, { artist: { name: { contains: w, mode: "insensitive" as const } } }, { artist: { genre: { contains: w, mode: "insensitive" as const } } }]) },
      take: 6, select: songSelect,
    });
    return songs.length ? { reply: "Here's what I found on Brisic.", tracks: [...songs.map(toTrack), ...sample.tracks].slice(0, 8) } : sample;
  },

  async getSpotlight() {
    const [rows, sample] = await Promise.all([
      prisma.video.findMany({ orderBy: [{ isLive: "desc" }, { createdAt: "desc" }], take: 40, select: videoSelect }),
      mockCatalog.getSpotlight(),
    ]);
    return [...rows.map(toSpotlight), ...sample];
  },

  async getSpotlightItem(id) {
    const own = strip(id, VIDEO);
    if (!own) return mockCatalog.getSpotlightItem(id);
    const v = await prisma.video.findUnique({ where: { id: own }, select: videoSelect });
    if (!v) return null;
    const more = await prisma.video.findMany({ where: { id: { not: own } }, orderBy: { createdAt: "desc" }, take: 6, select: videoSelect });
    // Count the view (best effort).
    prisma.video.update({ where: { id: own }, data: { views: { increment: 1 } } }).catch(() => {});
    return { item: toSpotlight(v), more: more.map(toSpotlight) };
  },

  async getShows() {
    const [rows, sample] = await Promise.all([
      prisma.podcastShow.findMany({ where: { episodes: { some: {} } }, orderBy: { createdAt: "desc" }, take: 30, select: showSelect }),
      mockCatalog.getShows(),
    ]);
    return [...rows.map(toShow), ...sample];
  },

  async getShow(id) {
    const s = await prisma.podcastShow.findUnique({ where: { id }, select: { ...showSelect, episodes: { orderBy: { number: "asc" }, select: episodeSelect } } });
    if (!s) return mockCatalog.getShow(id);
    return { show: toShow(s), episodes: s.episodes.map(toEpisode) };
  },

  async getEpisode(id) {
    const own = strip(id, EPISODE);
    if (!own) return mockCatalog.getEpisode(id);
    const e = await prisma.podcastEpisode.findUnique({ where: { id: own }, select: { ...episodeSelect, show: { select: showSelect } } });
    if (!e) return null;
    const siblings = await prisma.podcastEpisode.findMany({ where: { showId: e.show.id, id: { not: own } }, orderBy: { number: "desc" }, take: 10, select: episodeSelect });
    return { episode: toEpisode({ ...e, show: { id: e.show.id, title: e.show.title } }), show: toShow(e.show), more: siblings.map(toEpisode) };
  },
};
