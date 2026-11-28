// The genre, podcast-category and mood list shown on Search and Genres. This is a fixed category
// list (not content): a genre page shows the songs whose artist has that genre.
import type { Genre } from "./types";

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
export const GENRES: Genre[] = GENRE_SEED.map(([group, name, blurb]) => ({ id: slug(name), name, group, blurb }));
export const MUSIC_GENRES = GENRES.filter((g) => g.group === "music").map((g) => g.name);
