// Global Tune API adapter — THE ONE PLACE to connect the real music catalog.
//
// How to plug it in:
//   1. Set GLOBAL_TUNE_API_URL and GLOBAL_TUNE_API_KEY in .env
//   2. Fill in each method below so it returns the shapes in ./types
//      (map the API's field names to Track / Artist / Album / Playlist ...).
//      Track.streamUrl is what makes the player produce sound.
//   3. Set CATALOG_PROVIDER="globaltune" in .env
//
// Any method you have not implemented yet falls back to Brisic's own catalog (creator uploads).

import { brisicCatalog } from "./brisic";
import type { CatalogProvider } from "./types";

const BASE = process.env.GLOBAL_TUNE_API_URL;
const KEY = process.env.GLOBAL_TUNE_API_KEY;

/** Authenticated GET against the Global Tune API. Adjust the auth header to match their docs. */
export async function gt<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  if (!BASE) throw new Error("GLOBAL_TUNE_API_URL is not set");
  const url = new URL(path, BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: KEY ? { Authorization: `Bearer ${KEY}` } : {},
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Global Tune ${res.status} for ${path}`);
  return res.json() as Promise<T>;
}

export const globalTuneCatalog: CatalogProvider = {
  ...brisicCatalog,

  // Example of one implemented call (uncomment and adapt to the real response):
  //
  // async search(query) {
  //   const data = await gt<{ songs: ApiSong[] }>("/search", { q: query });
  //   return {
  //     tracks: data.songs.map(toTrack),
  //     artists: [], albums: [], playlists: [], shows: [],
  //   };
  // },
};
