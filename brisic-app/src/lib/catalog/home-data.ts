// Home screen shelves, in the order the team asked for. Admins put Brisic playlists into the
// playlist shelves; the other shelves fill themselves (podcasts, live parties, Artist Spotlight).
// A shelf with nothing in it is hidden.

export type ShelfKind = "playlists" | "large" | "podcasts" | "parties" | "spotlight";

export const SHELVES: { title: string; kind: ShelfKind }[] = [
  { title: "Afro-pop", kind: "playlists" },
  { title: "Playlist Made for you", kind: "large" },
  { title: "Street Anthem", kind: "playlists" },
  { title: "New Releases", kind: "playlists" },
  { title: "Top Charts Nigeria", kind: "playlists" },
  { title: "Hip-Hop & Rap", kind: "playlists" },
  { title: "Chill & R&B", kind: "playlists" },
  { title: "Gospel & Worship", kind: "playlists" },
  { title: "Podcasts for You", kind: "podcasts" },
  { title: "Throwback Classics", kind: "playlists" },
  { title: "Join a Party", kind: "parties" },
  { title: "Amapiano", kind: "playlists" },
  { title: "Reggae & Dancehall", kind: "playlists" },
  { title: "Pop Hits", kind: "playlists" },
  { title: "Workout & Energy", kind: "playlists" },
  { title: "Focus & Study", kind: "playlists" },
  { title: "Love Songs", kind: "playlists" },
  { title: "Artist Spotlight", kind: "spotlight" },
  { title: "Mood Boosters", kind: "playlists" },
];

/** Shelves an admin can put a playlist in. */
export const PLAYLIST_SHELVES = SHELVES.filter((s) => s.kind === "playlists" || s.kind === "large").map((s) => s.title);
export const isLargeShelf = (title: string) => SHELVES.some((s) => s.title === title && s.kind === "large");

/** Card colours from the prototype, offered when an admin makes a playlist. */
export const PALETTE: { name: string; from: string; to: string }[] = [
  { name: "Green", from: "#2c7a3a", to: "#0e3318" },
  { name: "Gold", from: "#f2a62a", to: "#b36a0a" },
  { name: "Ocean", from: "#1e6f86", to: "#0f4a60" },
  { name: "Blue", from: "#1c6be0", to: "#0a2a7a" },
  { name: "Sunset", from: "#e8562a", to: "#7d1f0a" },
  { name: "Magenta", from: "#c0309a", to: "#4a0f55" },
  { name: "Teal", from: "#2a8a8a", to: "#0c2a30" },
  { name: "Berry", from: "#7a2a8a", to: "#d63a5a" },
  { name: "Red", from: "#e02a2a", to: "#6a0a0a" },
  { name: "Night", from: "#142a5a", to: "#070d24" },
  { name: "Earth", from: "#8a6a2a", to: "#2a1a08" },
  { name: "Orange", from: "#e08a3a", to: "#5a2a10" },
  { name: "Purple", from: "#9a5ab8", to: "#2a0f45" },
];

/** Art for the Artist Spotlight shelf, in order (from the prototype's spotlight cards). */
export const SPOTLIGHT_ART: [string, string][] = [
  ["#3f9a2a", "#07120a"], ["#9a5ab8", "#2a0f45"], ["#e08a3a", "#5a2a10"], ["#2a5ac8", "#0c1a5a"], ["#2f7a34", "#10381a"], ["#d63a5a", "#5a1a3a"],
];
