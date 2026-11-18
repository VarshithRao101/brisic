"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Track } from "@/lib/catalog/types";
import { addToPlaylist, createPlaylist, recordPlay, setFollowing, setLiked } from "@/app/actions";

const snapOf = (t: Track) => ({ id: t.id, title: t.title, artistId: t.artistId, artistName: t.artistName, durationSec: t.durationSec });

// ───────────── Toast ─────────────

const ToastCtx = createContext<(message: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

// ───────────── Library (likes, follows, playlists, coins) ─────────────

export type LibraryInitial = {
  liked: string[];
  followed: string[];
  playlists: { id: string; name: string }[];
  coins: number;
};

type Library = {
  liked: Set<string>;
  followed: Set<string>;
  playlists: { id: string; name: string }[];
  coins: number;
  setCoins: (n: number) => void;
  toggleLike: (t: Track) => void;
  toggleFollow: (artistId: string, artistName: string) => void;
  newPlaylist: (name: string) => Promise<{ id: string; name: string } | null>;
  addTo: (playlistId: string, t: Track) => Promise<void>;
};
const LibraryCtx = createContext<Library | null>(null);
export const useLibrary = () => {
  const v = useContext(LibraryCtx);
  if (!v) throw new Error("useLibrary outside provider");
  return v;
};

// ───────────── Player ─────────────

type Player = {
  queue: Track[];
  index: number;
  current: Track | null;
  playing: boolean;
  position: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  /** 0 to 1. */
  volume: number;
  /** False while the catalog has no audio URLs; progress is then simulated. */
  hasAudio: boolean;
  playQueue: (tracks: Track[], start?: number) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (sec: number) => void;
  jump: (i: number) => void;
  enqueue: (t: Track) => void;
  removeAt: (i: number) => void;
  clearUpNext: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setVolume: (v: number) => void;
};
const PlayerCtx = createContext<Player | null>(null);
export const usePlayer = () => {
  const v = useContext(PlayerCtx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
};

const STORE = "brisic-player";

export function AppState({ initial, children }: { initial: LibraryInitial; children: ReactNode }) {
  // Toast
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  }, []);

  // Library
  const [liked, setLikedSet] = useState(() => new Set(initial.liked));
  const [followed, setFollowedSet] = useState(() => new Set(initial.followed));
  const [playlists, setPlaylists] = useState(initial.playlists);
  const [coins, setCoins] = useState(initial.coins);
  // When the server sends fresh library data (after a navigation or refresh), adopt it.
  const syncKey = [
    initial.liked.join("|"),
    initial.followed.join("|"),
    initial.playlists.map((p) => p.id + p.name).join("|"),
    initial.coins,
  ].join("#");
  const [lastSync, setLastSync] = useState(syncKey);
  if (lastSync !== syncKey) {
    setLastSync(syncKey);
    setLikedSet(new Set(initial.liked));
    setFollowedSet(new Set(initial.followed));
    setPlaylists(initial.playlists);
    setCoins(initial.coins);
  }

  const flip = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(id); else next.delete(id);
    return next;
  };

  const toggleLike = useCallback((t: Track) => {
    const on = !liked.has(t.id);
    setLikedSet((s) => flip(s, t.id, on));
    showToast(on ? "Added to Liked Songs" : "Removed from Liked Songs");
    setLiked(snapOf(t), on).catch(() => {
      setLikedSet((s) => flip(s, t.id, !on));
      showToast("Could not save. Check your connection.");
    });
  }, [liked, showToast]);

  const toggleFollow = useCallback((artistId: string, artistName: string) => {
    const on = !followed.has(artistId);
    setFollowedSet((s) => flip(s, artistId, on));
    showToast(on ? `Following ${artistName}` : `Unfollowed ${artistName}`);
    setFollowing(artistId, artistName, on).catch(() => {
      setFollowedSet((s) => flip(s, artistId, !on));
      showToast("Could not save. Check your connection.");
    });
  }, [followed, showToast]);

  const newPlaylist = useCallback(async (name: string) => {
    const r = await createPlaylist(name).catch(() => null);
    if (!r || !r.ok) {
      showToast(r && !r.ok ? r.error : "Could not create the playlist.");
      return null;
    }
    setPlaylists((p) => [{ id: r.id, name: r.name }, ...p]);
    return { id: r.id, name: r.name };
  }, [showToast]);

  const addTo = useCallback(async (playlistId: string, t: Track) => {
    const r = await addToPlaylist(playlistId, snapOf(t)).catch(() => null);
    showToast(r?.ok ? "Added to playlist" : "Could not add to the playlist.");
  }, [showToast]);

  // Player
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "all" | "one">("off");
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const restored = useRef(false);
  const current = queue[index] ?? null;
  const streamUrl = current?.streamUrl ?? null;

  // Restore the last queue (paused) after first load. Browser storage is only
  // readable after hydration, so this has to run in an effect.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const saved = JSON.parse(raw) as { queue: Track[]; index: number };
        if (Array.isArray(saved.queue) && saved.queue.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setQueue(saved.queue);
          setIndex(Math.min(saved.index || 0, saved.queue.length - 1));
        }
      }
    } catch {}
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(STORE, JSON.stringify({ queue: queue.slice(0, 100), index })); } catch {}
  }, [queue, index]);

  const next = useCallback(() => {
    setPosition(0);
    if (queue.length === 0) return;
    if (shuffle && queue.length > 1) {
      let r = index;
      while (r === index) r = Math.floor(Math.random() * queue.length);
      setIndex(r);
    } else if (index < queue.length - 1) {
      setIndex(index + 1);
    } else if (repeat === "all") {
      setIndex(0);
    } else {
      setPlaying(false);
    }
  }, [queue.length, shuffle, index, repeat]);

  /** A song reached its end on its own: repeat it, or move on. */
  const finished = useCallback(() => {
    if (repeat === "one") {
      setPosition(0);
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
      return;
    }
    next();
  }, [repeat, next]);

  const prev = useCallback(() => {
    if (position > 3 || index === 0) {
      setPosition(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else {
      setPosition(0);
      setIndex((i) => Math.max(0, i - 1));
    }
  }, [position, index]);

  // Real audio, when the catalog provides a stream URL.
  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.preload = "metadata";
      audioRef.current = a;
    }
    const a = audioRef.current;
    const onTime = () => setPosition(a.currentTime);
    const onEnd = () => finished();
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [finished]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!streamUrl) {
      a.pause();
      a.removeAttribute("src");
      return;
    }
    if (a.src !== streamUrl) a.src = streamUrl;
    if (playing) a.play().catch(() => setPlaying(false));
    else a.pause();
  }, [streamUrl, playing, current?.id]);

  // Simulated progress while there is no audio source: tick once a second, advance at the end.
  useEffect(() => {
    if (!playing || !current || streamUrl) return;
    const id = setTimeout(() => {
      if (position + 1 >= current.durationSec) finished();
      else setPosition(position + 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [playing, current, streamUrl, position, finished]);

  // Listening history + lock-screen metadata.
  const lastRecorded = useRef("");
  useEffect(() => {
    if (!playing || !current) return;
    if (lastRecorded.current !== current.id) {
      lastRecorded.current = current.id;
      recordPlay(snapOf(current)).catch(() => {});
    }
    try {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: current.title, artist: current.artistName, album: current.albumTitle ?? "" });
      }
    } catch {}
  }, [playing, current]);

  const player = useMemo<Player>(() => ({
    queue, index, current, playing, position, shuffle, repeat, volume,
    hasAudio: !!streamUrl,
    playQueue: (tracks, start = 0) => {
      if (!tracks.length) return;
      setQueue(tracks);
      setIndex(Math.max(0, Math.min(start, tracks.length - 1)));
      setPosition(0);
      setPlaying(true);
    },
    toggle: () => { if (current) setPlaying((p) => !p); },
    next, prev,
    seek: (sec) => {
      setPosition(sec);
      if (audioRef.current && streamUrl) audioRef.current.currentTime = sec;
    },
    jump: (i) => { setIndex(i); setPosition(0); setPlaying(true); },
    enqueue: (t) => {
      setQueue((q) => (q.some((x) => x.id === t.id) ? q : [...q, t]));
      showToast("Added to queue");
    },
    removeAt: (i) => {
      setQueue((q) => q.filter((_, n) => n !== i));
      setIndex((cur) => (i < cur ? cur - 1 : cur));
    },
    clearUpNext: () => setQueue((q) => q.slice(0, index + 1)),
    toggleShuffle: () => setShuffle((s) => !s),
    cycleRepeat: () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    setVolume: (v) => setVolume(Math.max(0, Math.min(1, v))),
  }), [queue, index, current, playing, position, shuffle, repeat, volume, streamUrl, next, prev, showToast]);

  const library = useMemo<Library>(
    () => ({ liked, followed, playlists, coins, setCoins, toggleLike, toggleFollow, newPlaylist, addTo }),
    [liked, followed, playlists, coins, toggleLike, toggleFollow, newPlaylist, addTo],
  );

  return (
    <ToastCtx.Provider value={showToast}>
      <LibraryCtx.Provider value={library}>
        <PlayerCtx.Provider value={player}>
          {children}
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-lg transition-all duration-200 bottom-40 lg:bottom-28 ${toast ? "opacity-100" : "translate-y-2 opacity-0"}`}
          >
            {toast}
          </div>
        </PlayerCtx.Provider>
      </LibraryCtx.Provider>
    </ToastCtx.Provider>
  );
}
