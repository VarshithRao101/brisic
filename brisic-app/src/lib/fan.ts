// Fan-economy constants. Prices are checked on the server against these.

export const WELCOME_BONUS = 500;

export const GIFTS = [
  { id: "mic", name: "Mic", tag: "Hand them the stage", price: 30, emoji: "🎤" },
  { id: "speaker", name: "Speaker", tag: "Boost their sound", price: 50, emoji: "🔊" },
  { id: "studiomic", name: "Studio Mic", tag: "Crystal-clear vocals", price: 80, emoji: "🎙️" },
  { id: "amp", name: "Amplifier", tag: "Turn it up loud", price: 120, emoji: "📻" },
  { id: "crown", name: "Crown", tag: "Crown them king of the scene", price: 300, emoji: "👑" },
  { id: "drums", name: "Drum Set", tag: "Keep the beat alive", price: 400, emoji: "🥁" },
  { id: "car", name: "Car", tag: "Send them off in style", price: 800, emoji: "🚗" },
  { id: "studio", name: "Studio", tag: "Build them a studio of their own", price: 100_000, emoji: "🏠" },
  { id: "universe", name: "Universe", tag: "The whole galaxy for them", price: 200_000, emoji: "🌌" },
  { id: "jet", name: "Private Jet", tag: "Fly them to the top of the world", price: 1_000_000, emoji: "🛩️" },
  { id: "watch", name: "Diamond Watch", tag: "A timeless flex for a legend", price: 2_500_000, emoji: "⌚" },
] as const;

export const COIN_PACKS = [100, 500, 1_000, 5_000, 10_000, 25_000, 100_000, 250_000].map((coins) => ({
  coins,
  metal: coins >= 1000 ? "Gold" : "Silver",
  priceNaira: coins, // 1 B-Coin = ₦1
}));

export const EXCLUSIVES = [
  { key: "song", kind: "UPCOMING SONG", title: "Midnight Prayer", desc: "An unreleased track. Hear it two weeks before everyone else.", meta: "Early access", price: 80 },
  { key: "story", kind: "THE STORY", title: "How It Started", desc: "The artist tells the story behind the music, in their own words.", meta: "Audio story", price: 60 },
  { key: "vault", kind: "VIDEO VAULT", title: "Studio Session Vault", desc: "Raw studio footage, voice notes and unfinished ideas from the making of the album.", meta: "12 videos", price: 150 },
  { key: "album", kind: "ALBUM PRESALE", title: "Gratitude (Full Album)", desc: "Get the whole upcoming album the moment it is ready, with exclusive bonus tracks.", meta: "14 tracks, coming soon", price: 400 },
] as const;

export const MERCH = [
  { id: "tee", name: "Tour Tee", price: 25, bg: "linear-gradient(135deg,#2f7a34,#10381a)" },
  { id: "hoodie", name: "Logo Hoodie", price: 55, bg: "linear-gradient(135deg,#7a2a8a,#2a0f45)" },
  { id: "cap", name: "Snapback Cap", price: 20, bg: "linear-gradient(135deg,#d6841a,#5a2a08)" },
  { id: "vinyl", name: "Vinyl Record", price: 35, bg: "linear-gradient(135deg,#1c6be0,#0a2a7a)" },
  { id: "poster", name: "Tour Poster", price: 12, bg: "linear-gradient(135deg,#c0309a,#4a0f55)" },
  { id: "tote", name: "Tote Bag", price: 18, bg: "linear-gradient(135deg,#1f9a9a,#0a3a4a)" },
] as const;

export const PREMIUM_PLANS = [
  { id: "individual", name: "Individual", desc: "For one person. Everything, no ads.", mult: 1 },
  { id: "student", name: "Student", desc: "Verified students get a lower price.", mult: 0.6 },
  { id: "duo", name: "Duo", desc: "Two accounts, one bill.", mult: 1.4 },
  { id: "family", name: "Family", desc: "Up to 6 accounts under one plan.", mult: 1.8 },
] as const;

export const PREMIUM_PERKS = [
  "Ad-free listening",
  "Offline downloads in the app",
  "High-quality audio",
  "Skip as much as you like",
  "Early access to exclusive drops",
];

// [country, monthly USD for Individual, currency prefix, local units per USD]
export const PREMIUM_REGIONS: [string, number, string, number][] = [
  ["Nigeria", 0.99, "₦", 1600], ["Ghana", 0.99, "GH₵", 15], ["Senegal", 0.99, "CFA ", 600],
  ["Kenya", 1.49, "KSh ", 130], ["Tanzania", 1.49, "TSh ", 2600], ["Uganda", 1.49, "USh ", 3700],
  ["South Africa", 2.99, "R", 18], ["India", 1.49, "₹", 84], ["United Kingdom", 4.99, "£", 0.78],
  ["United States", 4.99, "US$", 1], ["Other countries", 4.99, "US$", 1],
];
