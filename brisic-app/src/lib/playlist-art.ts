import { hashStr } from "@/lib/format";

/**
 * Playlist hero artwork from the Brisic design PDF: the neon B over coloured light waves,
 * one image per colour, with the matching track thumbnail where the design has one.
 * Each playlist always gets the same variant.
 */
const VARIANTS: { hero: string; thumb: string | null }[] = [
  { hero: "09", thumb: "09" }, // gold
  { hero: "10", thumb: "10" }, // blue
  { hero: "11", thumb: "11" }, // magenta
  { hero: "12", thumb: "12" }, // crimson
  { hero: "14", thumb: null }, // green with red sparks
  { hero: "17", thumb: "17" }, // sage
  { hero: "18", thumb: "18" }, // yellow
  { hero: "19", thumb: "19" }, // amber
  { hero: "20", thumb: "20" }, // purple
  { hero: "21", thumb: "21" }, // orange fire
  { hero: "22", thumb: "22" }, // electric blue
  { hero: "25", thumb: "25" }, // red
  { hero: "27", thumb: "27" }, // aqua
  { hero: "30", thumb: "30" }, // cyan
];

/** The five designs the team picked (Throwback Classics, Playlist made for you). */
const PICKED = ["x17", "x18", "x19", "x20", "x21"].map((k) => ({ hero: k, thumb: k }));

/** Every artwork an admin can pick for a Brisic playlist. */
export const ART_CHOICES = [...PICKED, ...VARIANTS].map((v) => ({ id: v.hero, thumb: `/assets/playlists/${v.thumb ? "thumb" : "hero"}-${v.thumb ?? v.hero}.jpg` }));

/** Artwork for a playlist page: the variant the admin picked, otherwise one chosen from the id. */
export function playlistArt(playlistId: string, hero?: string | null) {
  const v = [...PICKED, ...VARIANTS].find((x) => x.hero === hero) ?? VARIANTS[hashStr(playlistId) % VARIANTS.length];
  return {
    hero: `/assets/playlists/hero-${v.hero}.jpg`,
    thumb: v.thumb ? `/assets/playlists/thumb-${v.thumb}.jpg` : null,
  };
}
