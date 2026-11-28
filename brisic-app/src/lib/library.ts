import { catalog, type Track } from "@/lib/catalog";

type Saved = { trackId: string; title: string; artistId: string; artistName: string; durationSec: number };

/**
 * Turns saved rows (likes, playlist items, history) into playable tracks, using the live catalog
 * copy so stream URLs and artwork stay current. Songs that are no longer on Brisic (deleted by
 * the artist, or old sample songs) are left out.
 */
export async function hydrate(rows: Saved[]): Promise<Track[]> {
  if (!rows.length) return [];
  return catalog.getTracksByIds(rows.map((r) => r.trackId)).catch(() => [] as Track[]);
}

/** Keeps the first occurrence of each track. */
export function uniqueByTrack<T extends { trackId: string }>(rows: T[]) {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.trackId) ? false : (seen.add(r.trackId), true)));
}
