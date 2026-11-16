// Shapes every screen reads. The Global Tune API adapter must return these.

export type Track = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId?: string | null;
  albumTitle?: string | null;
  durationSec: number;
  streams: number;
  /** Direct audio URL. null until the music API is connected. */
  streamUrl?: string | null;
  /** Cover image URL. null falls back to a generated cover. */
  artwork?: string | null;
};

export type Artist = {
  id: string;
  name: string;
  genre: string;
  bio: string;
  monthlyListeners: number;
  image?: string | null;
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  year: number;
  trackCount: number;
  artwork?: string | null;
};

export type Playlist = {
  id: string;
  title: string;
  subtitle: string;
  trackCount: number;
  artwork?: string | null;
};

export type Genre = {
  id: string;
  name: string;
  group: "music" | "podcasts" | "moods";
  blurb: string;
};

export type Station = { id: string; name: string; subtitle: string };

export type Show = {
  id: string;
  title: string;
  host: string;
  blurb: string;
  about: string;
  episodeCount: number;
};

export type Episode = {
  id: string;
  showId: string;
  showTitle: string;
  number: number;
  title: string;
  minutes: number;
  description: string;
  /** Video/audio URL. null until the media API is connected. */
  mediaUrl?: string | null;
};

export type HomeSection = { id: string; title: string; playlists: Playlist[] };

export type SearchResults = {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  shows: Show[];
};

export type TrackDetails = {
  lyrics: { section?: string; text: string }[];
  about?: string;
  credits: { label: string; value: string }[];
};

/** Everything the app needs from a music source. */
export interface CatalogProvider {
  /** True when the data is placeholder content, not a live catalog. */
  readonly isSample: boolean;
  getHomeSections(): Promise<HomeSection[]>;
  getSection(id: string): Promise<HomeSection | null>;
  getTrendingArtists(period: "week" | "month"): Promise<Artist[]>;
  getArtist(id: string): Promise<{ artist: Artist; topTracks: Track[]; albums: Album[] } | null>;
  getAlbum(id: string): Promise<{ album: Album; tracks: Track[] } | null>;
  getPlaylist(id: string): Promise<{ playlist: Playlist; tracks: Track[] } | null>;
  getGenres(): Promise<Genre[]>;
  getGenre(id: string): Promise<{ genre: Genre; tracks: Track[]; artists: Artist[]; playlists: Playlist[] } | null>;
  getStations(): Promise<Station[]>;
  getStationTracks(id: string): Promise<Track[]>;
  getTrackDetails(id: string): Promise<TrackDetails | null>;
  /** Fresh copies of saved songs (liked, playlists, history). Unknown ids are skipped. */
  getTracksByIds(ids: string[]): Promise<Track[]>;
  search(query: string): Promise<SearchResults>;
  getShows(): Promise<Show[]>;
  getShow(id: string): Promise<{ show: Show; episodes: Episode[] } | null>;
  getEpisode(id: string): Promise<{ episode: Episode; show: Show; more: Episode[] } | null>;
  /** Picks for the Brisic AI screen from a free-text request. */
  suggest(prompt: string): Promise<{ reply: string; tracks: Track[] }>;
}
