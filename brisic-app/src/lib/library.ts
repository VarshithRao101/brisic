import { catalog, type Track } from "@/lib/catalog";

type Saved = { trackId: string; title: string; artistId: string; artistName: string; durationSec: number };

/**
 * Turns saved rows (likes, playlist items, history) into playable tracks.
 * Uses the live catalog copy when it exists, so stream URLs and artwork stay current,
 * and falls back to the saved snapshot when the catalog no longer has the song.
 */
export async function hydrate(rows: Saved[]): Promise<Track[]> {
  if (!rows.length) return [];
  const fresh = await catalog.getTracksByIds(rows.map((r) => r.trackId)).catch(() => [] as Track[]);
  const byId = new Map(fresh.map((t) => [t.id, t]));
  return rows.map(
    (r) =>
      byId.get(r.trackId) ?? {
        id: r.trackId, title: r.title, artistId: r.artistId, artistName: r.artistName,
        durationSec: r.durationSec, streams: 0, streamUrl: null, artwork: null,
      },
  );
}

/** Keeps the first occurrence of each track. */
export function uniqueByTrack<T extends { trackId: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.trackId) ? false : (seen.add(r.trackId), true)));
}
