// Sample catalog used until the Global Tune API is connected.
// Fictional artists and titles only; no audio (streamUrl is null).

import type {
  Album,
  Artist,
  CatalogProvider,
  Episode,
  Genre,
  HomeSection,
  Playlist,
  Show,
  SpotlightItem,
  Station,
  Track,
} from "./types";

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ARTIST_SEED: [string, string, number, string][] = [
  ["Kelechi Ade", "Afrobeats", 3_200_000, "Lagos-born hitmaker turning street stories into stadium choruses."],
  ["Tobi Rae", "Afro-pop", 2_900_000, "Catchy hooks, big choruses and songs made for the dance floor."],
  ["Nuela", "Afro-fusion", 1_800_000, "Blends Afrobeats with soul and jazz, and sings like she is telling you a secret."],
  ["Dayo Mane", "Hip-Hop", 2_100_000, "Sharp bars over heavy drums. Rap that sounds like home."],
  ["Sade Vox", "R&B", 1_400_000, "Smooth, slow and honest. Late-night R&B with a West African heart."],
  ["Kofi Lane", "Highlife", 900_000, "Classic highlife guitar lines for a new generation."],
  ["Zuri Kaya", "Afrobeats", 1_200_000, "An emerging artist blending Afrobeats, R&B and street poetry about growing up and big dreams."],
  ["Ayo Blaze", "Gospel", 760_000, "Upbeat praise and quiet worship from a voice raised in the choir."],
  ["Unknown Artist", "Afro-fusion", 1_200_000, "New sound. Same dream. An anonymous artist bringing fresh vibes and real stories to the world. Started making music in a small room with a borrowed microphone. Every song is a letter to the people who believed first."],
  ["Kemi", "Amapiano", 640_000, "Log drums, soft keys and slow-building grooves."],
  ["Tolu", "Afro-pop", 580_000, "Bright melodies and feel-good anthems."],
];

const TITLE_POOL = [
  "Midnight Run", "Golden Hour", "Feel It", "Run Free", "All Night", "Hold On",
  "Good Energy", "Sunrise", "Higher", "Take Me Home", "Wave", "Lights Out",
  "Vibe High", "No Limit", "My Way", "Forever", "Never Stop", "One Life",
  "Lagos Lights", "Run It Up", "Slow Down", "Last Dance", "Two Worlds", "Bloom",
  "Golden Thread", "Homecoming", "Sunday Light", "Hype Me", "Sweet Trouble", "My Lane",
  "Show Me", "Glow Up", "Midnight Prayer", "Joy Ride", "Fresh Start", "Carry Me",
  "Street Poetry", "Open Road", "Stay True", "First Believers", "Small Room", "Big Dreams",
  "Home Soon", "Thank You", "New Dawn", "Soft Life", "Grace Notes", "Peace Within",
  "Praise Break", "Street Heat", "Late Nights", "Good Vibes", "Borrowed Mic", "City Rain",
  "Stay Close", "Open Sky", "Brand New", "Day One", "Mama Said", "Easy Now",
];
const FIXED_TITLES: Record<string, string[]> = {
  "unknown-artist": ["Lost in the Noise", "Different", "Still Here", "Real Ones", "Better Days", "Dreams in Silence"],
  "zuri-kaya": ["Tornado"],
};
const ALBUM_TITLES = ["Homecoming", "Hype Season", "Two Worlds", "Fire", "Joy", "Golden Thread", "Bloom", "Sunday Light", "Gratitude", "Glow Up", "Show Me"];

const artists: Artist[] = ARTIST_SEED.map(([name, genre, listeners, bio]) => ({
  id: slug(name), name, genre, bio, monthlyListeners: listeners, image: null,
}));

const albums: Album[] = artists.map((a, i) => ({
  id: "al-" + slug(ALBUM_TITLES[i]) + "-" + a.id,
  title: ALBUM_TITLES[i], artistId: a.id, artistName: a.name,
  year: 2024 + (i % 3), trackCount: 6, artwork: null,
}));

const tracks: Track[] = [];
{
  let pool = 0;
  artists.forEach((a, ai) => {
    const fixed = FIXED_TITLES[a.id] ?? [];
    for (let n = 0; n < 6; n++) {
      const title = fixed[n] ?? TITLE_POOL[pool++ % TITLE_POOL.length];
      const id = "t-" + a.id + "-" + slug(title);
      const h = hash(id);
      tracks.push({
        id, title, artistId: a.id, artistName: a.name,
        albumId: albums[ai].id, albumTitle: albums[ai].title,
        durationSec: 165 + (h % 80),
        streams: 300_000 + (h % 3_100_000),
        streamUrl: null, artwork: null,
      });
    }
  });
}

const pick = (seed: string, count: number, from: Track[] = tracks) => {
  const h = hash(seed);
  const step = 7 + (h % 5) * 2;
  const out: Track[] = [];
  for (let i = 0; out.length < Math.min(count, from.length) && i < from.length * 3; i++) {
    const t = from[(h + i * step) % from.length];
    if (!out.includes(t)) out.push(t);
  }
  return out;
};

const SECTION_SEED: [string, [string, string][]][] = [
  ["New Releases", [["Midnight Prayer", "New drop"], ["Joy Ride", "Fresh this week"], ["Lagos Lights", "City sounds"], ["Fresh Start", "Brand new"]]],
  ["Updated daily", [["Naija Top 10", "This week"], ["Afro Viral", "Trending now"], ["Rising Stars", "Emerging artists"]]],
  ["Hip-Hop & Rap", [["Street Heat", "Hip-hop hits"], ["Cypher Nights", "Freestyle vibes"], ["Bars & Beats", "Lyrical picks"], ["Rap Naija", "Home grown"]]],
  ["Chill & R&B", [["Slow Jams", "Smooth R&B"], ["Soft Life", "Easy listening"], ["Sunday Calm", "Wind down"], ["Late Vibes", "After dark"]]],
  ["Gospel & Worship", [["Morning Worship", "Start the day"], ["Grace Notes", "Gospel favourites"], ["Praise Break", "Upbeat praise"], ["Peace Within", "Calm and prayerful"]]],
  ["Made for you", [["Afrobeats Hits", "The biggest songs"], ["Good Vibes", "Feel-good picks"], ["Late Nights", "For after midnight"], ["My Vibe", "Your daily mix"]]],
];
const sections: HomeSection[] = SECTION_SEED.map(([title, lists]) => ({
  id: slug(title), title,
  playlists: lists.map(([name, subtitle]) => ({ id: "pl-" + slug(name), title: name, subtitle, trackCount: 14, artwork: null })),
}));
const playlists: Playlist[] = sections.flatMap((s) => s.playlists);

const GENRE_SEED: [Genre["group"], string, string][] = [
  ["music", "Afrobeats", "The sound of Lagos, loved around the world"],
  ["music", "Afro-fusion", "Afrobeats blended with soul, jazz and the world"],
  ["music", "Afro-pop", "Catchy hooks, big choruses, made for the dance floor"],
  ["music", "Amapiano", "Log drums, soft keys and slow-building grooves"],
  ["music", "Highlife", "Classic West African guitar music"],
  ["music", "Fuji & Juju", "Yoruba percussion and praise traditions"],
  ["music", "Hip-Hop", "Bars, beats and street stories"],
  ["music", "Trap", "Heavy 808s and sharp flows"],
  ["music", "R&B", "Smooth and slow"],
  ["music", "Soul", "Songs that come from deep down"],
  ["music", "Pop", "The songs everyone is singing"],
  ["music", "Alternative", "Left of centre"],
  ["music", "House", "Four on the floor"],
  ["music", "Dancehall", "Riddims from the islands"],
  ["music", "Reggae", "Roots, rock, reggae"],
  ["music", "Jazz", "Improvised and timeless"],
  ["music", "Gospel", "Worship and praise"],
  ["music", "Lo-fi", "Soft beats to slow down to"],
  ["podcasts", "Music Talk", "Conversations about the music"],
  ["podcasts", "Comedy", "Comedy and fun"],
  ["podcasts", "Stories", "Stories of people breaking out"],
  ["podcasts", "Faith & Life", "Faith in music and in life"],
  ["podcasts", "News & Culture", "Music, culture and news"],
  ["podcasts", "Interviews", "Artists in their own words"],
  ["moods", "Workout", "Keep moving"],
  ["moods", "Focus", "Heads down"],
  ["moods", "Chill", "Easy does it"],
  ["moods", "Party", "Turn it up"],
  ["moods", "Love", "For the one you are thinking about"],
  ["moods", "Sleep", "Slow everything down"],
  ["moods", "Throwback", "Songs you forgot you loved"],
  ["moods", "Road Trip", "Windows down"],
];
const genres: Genre[] = GENRE_SEED.map(([group, name, blurb]) => ({ id: slug(name), name, group, blurb }));

const stations: Station[] = [
  ["Afrobeats", "Non-stop hits"], ["Amapiano", "Log drum all day"], ["Naija Pop", "Fresh from Lagos"],
  ["Gospel", "Worship and praise"], ["Hip-Hop", "Bars and beats"], ["R&B", "Smooth and slow"],
  ["Highlife", "Classic West African"],
].map(([name, subtitle]) => ({ id: "st-" + slug(name), name, subtitle }));

const SHOW_SEED: [string, string, string, string[]][] = [
  ["Behind the Music", "Ama Quaye", "Stories behind the music", ["The early days", "Studio nights", "Who believed first", "Faith and the grind", "Writing the hook", "Lagos to the world"]],
  ["The Come Up", "Chidi O.", "Stories of people breaking out", ["First paycheck", "Sleeping in the studio", "The song that changed it", "Staying independent"]],
  ["Afro Talks", "Amaka N.", "Music, culture and news", ["This week in Afrobeats", "Who owns the sound?", "Festival season", "The producers"]],
  ["Faith & Frequency", "Tunde A.", "Faith in music", ["Choir kids", "Sunday morning songs", "Doubt and devotion"]],
  ["Studio Stories", "Zainab K.", "Behind the scenes", ["The borrowed mic", "One take", "Mixing at 3am"]],
  ["Laugh Lounge", "Femi B.", "Comedy and fun", ["Bad first gigs", "Tour bus rules", "Stage names we regret"]],
];
const shows: Show[] = SHOW_SEED.map(([title, host, blurb, eps]) => ({
  id: "sh-" + slug(title), title, host, blurb, episodeCount: eps.length,
  about: "Real conversations about the early days, the studio nights and the people who believed first. Every week the host sits down with a guest to talk about music, faith, hustle and home.",
}));
const episodes: Episode[] = SHOW_SEED.flatMap(([title, , , eps]) =>
  eps.map((ep, i) => ({
    id: "ep-" + slug(title) + "-" + (i + 1), showId: "sh-" + slug(title), showTitle: title,
    number: i + 1, title: ep, minutes: 28 + (hash(ep) % 30),
    description: "A conversation about " + ep.toLowerCase() + ", and what it taught the guest about making music that lasts.",
    mediaUrl: null,
  })),
);

const LYRICS = [
  { section: "Verse 1", text: "City lights are singing low" }, { text: "I follow where the rhythm goes" },
  { text: "Every step a drum I know" }, { text: "Carrying my dreams like gold" },
  { section: "Chorus", text: "Lost in the noise, I found my voice" }, { text: "Turn it up, we have no choice" },
  { text: "Lost in the noise, we rise tonight" }, { text: "Brisic fire, burning bright" },
  { section: "Verse 2", text: "Sunrise falls on Lagos streets" }, { text: "Every heart keeps the same beat" },
  { text: "From the block to the world stage" }, { text: "We write our names on every page" },
];

const match = (text: string, q: string) => text.toLowerCase().includes(q);
const byGenre = (name: string) => {
  const ids = artists.filter((a) => a.genre.toLowerCase() === name.toLowerCase()).map((a) => a.id);
  return tracks.filter((t) => ids.includes(t.artistId));
};


// Artist Spotlight sample videos (no media until the API is connected).
const SPOT: [string, string, SpotlightItem["kind"], number, number, string][] = [
  ["kelechi-ade", "Exclusive Performance", "Video", 332, 246_000, "An exclusive stage performance, filmed for Brisic fans. Watch it, share it, and show Kelechi some love."],
  ["tobi-rae", "Live Session", "Live", 0, 18_000, "Soulful live singer. Raw one-take sessions with a full band, streaming now."],
  ["nuela", "Meet Nuela", "Interview", 860, 52_000, "Nuela talks love songs, Lagos nights and the record that changed her life."],
  ["dayo-mane", "Behind the Scenes", "Video", 728, 39_000, "A day in the studio with Dayo Mane: drums first, bars second, coffee always."],
  ["sade-vox", "Studio Walkthrough", "Video", 610, 98_000, "Sade Vox opens the doors to the room where every late-night record is made."],
  ["kofi-lane", "Spotlight of the Week", "Interview", 1010, 5_000, "Highlife guitar for a new generation. Kofi Lane on keeping the old sound alive."],
  ["zuri-kaya", "Meet Zuri Kaya", "Interview", 980, 29_000, "Growing up, big dreams and street poetry. The story behind Tornado."],
  ["unknown-artist", "Midnight Sessions", "Audio", 1540, 38_000, "Voice notes and unfinished ideas from a small room with a borrowed microphone."],
  ["ayo-blaze", "Worship Night Live", "Live", 0, 7_400, "Upbeat praise and quiet worship, live from the choir loft."],
  ["kemi", "Amapiano Masterclass", "Video", 1320, 21_000, "Log drums, soft keys and slow-building grooves, explained step by step."],
  ["tolu", "Documentary: Day One", "Video", 1860, 64_000, "From church choir to festival stages. A short film about Tolu."],
  ["kelechi-ade", "Meet Kelechi Ade", "Interview", 905, 120_000, "Afrobeats storyteller. Warm vocals, songs about love and city hustle."],
];
const spotlight: SpotlightItem[] = SPOT.map(([artistId, title, kind, durationSec, views, blurb]) => ({
  id: "sp-" + artistId + "-" + slug(title),
  artistId,
  artistName: artists.find((a) => a.id === artistId)?.name ?? "Unknown Artist",
  title, kind, durationSec, views, blurb, mediaUrl: null, poster: null,
}));

export const mockCatalog: CatalogProvider = {
  isSample: true,

  async getHomeSections() { return sections; },
  async getSection(id) { return sections.find((s) => s.id === id) ?? null; },

  async getTrendingArtists(period) {
    const list = [...artists].sort((a, b) => b.monthlyListeners - a.monthlyListeners);
    return period === "week" ? list : [...list.slice(2), ...list.slice(0, 2)];
  },

  async getArtist(id) {
    const artist = artists.find((a) => a.id === id);
    if (!artist) return null;
    return {
      artist,
      topTracks: tracks.filter((t) => t.artistId === id).sort((a, b) => b.streams - a.streams),
      albums: albums.filter((a) => a.artistId === id),
    };
  },

  async getAlbum(id) {
    const album = albums.find((a) => a.id === id);
    return album ? { album, tracks: tracks.filter((t) => t.albumId === id) } : null;
  },

  async getPlaylist(id) {
    const playlist = playlists.find((p) => p.id === id);
    return playlist ? { playlist, tracks: pick(id, playlist.trackCount) } : null;
  },

  async getGenres() { return genres; },
  async getGenre(id) {
    const genre = genres.find((g) => g.id === id);
    if (!genre) return null;
    const own = byGenre(genre.name);
    const list = own.length >= 6 ? own : pick(id, 12);
    const artistIds = [...new Set(list.map((t) => t.artistId))];
    return {
      genre,
      tracks: [...list].sort((a, b) => b.streams - a.streams).slice(0, 12),
      artists: artists.filter((a) => artistIds.includes(a.id)).slice(0, 8),
      playlists: pick(id + "pl", 1).length ? playlists.filter((_, i) => (hash(id) + i) % 5 === 0).slice(0, 4) : [],
    };
  },

  async getStations() { return stations; },
  async getStationTracks(id) {
    const st = stations.find((s) => s.id === id);
    const own = st ? byGenre(st.name) : [];
    return own.length >= 6 ? own : pick(id, 20);
  },

  async getTrackDetails(id) {
    const t = tracks.find((x) => x.id === id);
    if (!t) return null;
    return {
      lyrics: t.title === "Lost in the Noise" ? LYRICS : [],
      credits: [
        { label: "Performed by", value: t.artistName },
        { label: "Album", value: t.albumTitle ?? "Single" },
      ],
    };
  },

  async getTracksByIds(ids) {
    return tracks.filter((t) => ids.includes(t.id));
  },

  async search(query) {
    const q = query.trim().toLowerCase();
    if (!q) return { tracks: [], artists: [], albums: [], playlists: [], shows: [] };
    return {
      tracks: tracks.filter((t) => match(t.title, q) || match(t.artistName, q)).slice(0, 12),
      artists: artists.filter((a) => match(a.name, q) || match(a.genre, q)).slice(0, 8),
      albums: albums.filter((a) => match(a.title, q) || match(a.artistName, q)).slice(0, 8),
      playlists: playlists.filter((p) => match(p.title, q) || match(p.subtitle, q)).slice(0, 8),
      shows: shows.filter((s) => match(s.title, q) || match(s.blurb, q) || match(s.host, q)).slice(0, 6),
    };
  },

  async getShows() { return shows; },
  async getShow(id) {
    const show = shows.find((s) => s.id === id);
    return show ? { show, episodes: episodes.filter((e) => e.showId === id) } : null;
  },
  async getEpisode(id) {
    const episode = episodes.find((e) => e.id === id);
    if (!episode) return null;
    return {
      episode,
      show: shows.find((s) => s.id === episode.showId)!,
      more: episodes.filter((e) => e.showId === episode.showId && e.id !== id),
    };
  },

  async getSpotlight() { return spotlight; },
  async getSpotlightItem(id) {
    const item = spotlight.find((s) => s.id === id);
    if (!item) return null;
    const same = spotlight.filter((s) => s.id !== id && s.artistId === item.artistId);
    return { item, more: [...same, ...spotlight.filter((s) => s.id !== id && s.artistId !== item.artistId)].slice(0, 6) };
  },

  async suggest(prompt) {
    const p = prompt.toLowerCase();
    const g = genres.find((x) => p.includes(x.name.toLowerCase()));
    if (g) {
      const own = byGenre(g.name);
      return { reply: `Here are some ${g.name} picks.`, tracks: (own.length ? own : pick(g.id, 6)).slice(0, 6) };
    }
    const a = artists.find((x) => p.includes(x.name.toLowerCase()));
    if (a) return { reply: `Top songs from ${a.name}.`, tracks: tracks.filter((t) => t.artistId === a.id) };
    if (/chill|relax|calm|sleep|slow/.test(p)) return { reply: "Chill mode on. These are easy to listen to.", tracks: byGenre("R&B").concat(pick("chill", 3)).slice(0, 6) };
    if (/party|dance|hype|workout/.test(p)) return { reply: "Turning it up.", tracks: byGenre("Afro-pop").slice(0, 6) };
    if (/worship|gospel|praise|pray/.test(p)) return { reply: "Worship and praise, coming up.", tracks: byGenre("Gospel").slice(0, 6) };
    return { reply: "Here are the top tracks right now.", tracks: [...tracks].sort((x, y) => y.streams - x.streams).slice(0, 6) };
  },
};
