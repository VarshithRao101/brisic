"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Artist, Track } from "@/lib/catalog/types";
import { Icon } from "@/components/icons";
import { Cover } from "@/components/cover";
import { TrackList } from "@/components/track-list";
import { searchLive } from "@/app/actions";

const KEY = "brisic-recent-searches";
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Search field plus the live search screen. Tapping the field opens the screen with the songs the
 * user played recently; typing shows matching songs and artists straight away (songs from their own
 * history first), so they can play without pressing Enter. The page content (genres, full results)
 * shows again when the field is closed.
 */
export function SearchBox({ initial, recentTracks = [], children }: { initial: string; recentTracks?: Track[]; children?: React.ReactNode }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [live, setLive] = useState<{ q: string; tracks: Track[]; artists: Artist[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  // Browser storage is only readable after hydration, so this has to run in an effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setRecent(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
  }, []);

  // Live results while typing (debounced; stale answers are ignored).
  const term = q.trim();
  useEffect(() => {
    if (!open || term.length < 1) return;
    let stale = false;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await searchLive(term).catch(() => null);
      if (stale) return;
      setLoading(false);
      if (r) setLive({ q: term, ...r });
    }, 220);
    return () => { stale = true; clearTimeout(t); };
  }, [term, open]);

  const remember = (t: string) => {
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  };

  const go = (raw: string) => {
    const t = raw.trim();
    setOpen(false);
    input.current?.blur();
    if (!t) return router.push("/search");
    remember(t);
    setQ(t);
    router.push("/search?q=" + encodeURIComponent(t));
  };

  const close = () => { setOpen(false); setQ(initial); input.current?.blur(); };

  const fromHistory = term ? recentTracks.filter((t) => norm(`${t.title} ${t.artistName}`).includes(norm(term))) : recentTracks;
  const historyIds = new Set(fromHistory.map((t) => t.id));
  const results = live && term ? live.tracks.filter((t) => !historyIds.has(t.id)) : [];
  const artists = live && term ? live.artists : [];
  const nothing = term && live?.q === term && !loading && !fromHistory.length && !results.length && !artists.length;

  return (
    <div>
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q); }} className="flex items-center gap-3">
        <div className="relative flex-1">
          <label className="sr-only" htmlFor="search-input">Search songs, artists and podcasts</label>
          <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            ref={input} id="search-input" type="search" enterKeyHint="search" autoComplete="off"
            className="field !border-primary/70 !pl-12 !pr-12 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)] [&::-webkit-search-cancel-button]:hidden"
            placeholder="Search artists, songs, albums…" value={q}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          />
          {q && (
            <button type="button" aria-label="Clear search" onClick={() => { setQ(""); setLive(null); setOpen(true); input.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-1.5 text-muted">
              <Icon name="x" size={18} />
            </button>
          )}
        </div>
        {open && <button type="button" onClick={close} className="shrink-0 border-0 bg-transparent p-0 text-[14.5px] font-medium text-primary">Cancel</button>}
      </form>

      {!open ? children : (
        <div className="mt-4 min-h-[60vh]">
          {!term && recent.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="m-0 text-[15px] font-semibold text-white">Recently searched</h2>
                <button type="button" className="border-0 bg-transparent p-0 text-[13px] text-muted hover:text-ink" onClick={() => { setRecent([]); try { localStorage.removeItem(KEY); } catch {} }}>Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => <button key={r} type="button" onClick={() => go(r)} className="btn btn-sm font-normal">{r}</button>)}
              </div>
            </div>
          )}

          {fromHistory.length > 0 && (
            <section className="mb-4">
              <h2 className="m-0 mb-1 flex items-center gap-2 text-[16px] font-semibold text-white">
                <Icon name="history" size={17} className="text-primary" /> {term ? "From your listening" : "Recently played"}
              </h2>
              <TrackList tracks={fromHistory.slice(0, term ? 5 : 10)} numbered={false} showStreams={false} />
            </section>
          )}
          {!term && !fromHistory.length && !recent.length && (
            <p className="m-0 mt-6 text-center text-[14px] font-light text-muted">Search for a song, an artist or a podcast. Songs you play show up here.</p>
          )}

          {artists.length > 0 && (
            <section className="mb-4">
              <h2 className="m-0 mb-2 text-[16px] font-semibold text-white">Artists</h2>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {artists.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/artist/${a.id}`} onClick={() => remember(term)} className="flex items-center gap-3 rounded-xl px-1 py-1.5 hover:bg-white/5">
                      <span className="w-11 shrink-0"><Cover seed={a.id} src={a.image} round ring={false} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-medium text-white">{a.name}</span>
                        <span className="block text-[12.5px] font-light text-muted">Artist · {a.genre}</span>
                      </span>
                      <Icon name="chevron" size={16} className="text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {results.length > 0 && (
            <section className="mb-4">
              <h2 className="m-0 mb-1 text-[16px] font-semibold text-white">Songs</h2>
              <TrackList tracks={results.slice(0, 8)} numbered={false} />
            </section>
          )}

          {term && loading && !live && <p className="m-0 mt-6 text-center text-[14px] text-muted">Searching…</p>}
          {nothing && <p className="m-0 mt-6 text-center text-[14px] font-light text-muted">No songs or artists match “{term}”. Check the spelling or try another name.</p>}
          {term && (
            <button type="button" onClick={() => go(term)} className="btn btn-outline mt-2 w-full">
              <Icon name="search" size={17} /> See all results for “{term}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
