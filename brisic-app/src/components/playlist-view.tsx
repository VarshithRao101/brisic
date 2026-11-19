"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/catalog/types";
import { toggleSavedPlaylist } from "@/app/actions";
import { usePlayer, useToast } from "@/components/app-state";
import { Icon } from "@/components/icons";
import { TrackList } from "@/components/track-list";

/**
 * The neon-B hero strip from the design: short and wide, a small B with the light waves
 * running across. Phones show it edge to edge; wide screens centre it with dark sides.
 */
export function PlaylistHero({ src }: { src: string }) {
  return (
    <>
      <Image src={src} alt="" fill priority sizes="(min-width: 1024px) 760px, 100vw" className="object-cover lg:object-contain" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-black" />
      <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(90deg,#000_0%,transparent_20%,transparent_80%,#000_100%)] lg:block" />
    </>
  );
}

/** Hero box sized to the image (720 × 226), capped on wide screens. */
export const HERO_BOX = "relative -mx-4 -mt-3 aspect-[720/226] overflow-hidden bg-black sm:-mx-6 lg:mx-0 lg:mt-0 lg:aspect-auto lg:h-[240px] lg:rounded-3xl";

const SORTS = [
  { id: "popular", label: "Most Popular", by: (a: Track, b: Track) => b.streams - a.streams },
  { id: "title", label: "Title", by: (a: Track, b: Track) => a.title.localeCompare(b.title) },
  { id: "artist", label: "Artist", by: (a: Track, b: Track) => a.artistName.localeCompare(b.artistName) },
  { id: "short", label: "Shortest", by: (a: Track, b: Track) => a.durationSec - b.durationSec },
  { id: "order", label: "Playlist order", by: () => 0 },
] as const;

const fmtLength = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.round((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m} min`;
};

/** Playlist screen from the design: neon B hero, Play / Shuffle / like / more, sortable tracks. */
export function PlaylistView({ playlist, tracks, saved: savedInitial, art }: {
  playlist: { id: string; title: string; subtitle: string };
  tracks: Track[];
  saved: boolean;
  /** Hero image and row thumbnail from the design (see lib/playlist-art). */
  art: { hero: string; thumb: string | null };
}) {
  const router = useRouter();
  const player = usePlayer();
  const toast = useToast();
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("popular");
  const [saved, setSaved] = useState(savedInitial);
  const [menu, setMenu] = useState(false);
  const shown = useMemo(() => (sort === "order" ? tracks : [...tracks].sort(SORTS.find((s) => s.id === sort)!.by)), [tracks, sort]);
  const total = tracks.reduce((n, t) => n + t.durationSec, 0);
  const playingHere = player.current && tracks.some((t) => t.id === player.current!.id);

  return (
    <>
      <div className={HERO_BOX}>
        <PlaylistHero src={art.hero} />
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-3 top-[10%] flex h-10 w-10 items-center justify-center border-0 bg-transparent p-0 text-white">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        </button>
        <Link href="/profile" aria-label="Profile" className="absolute right-3 top-[10%] flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-black/40 text-primary">
          <Icon name="user" size={20} />
        </Link>
      </div>

      <p className="m-0 mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">Playlist</p>
      <h1 className="m-0 text-[36px] font-bold leading-[1.05] text-primary sm:text-[48px]">{playlist.title}</h1>

      <p className="m-0 mt-2 max-w-2xl text-[15px] text-white/90">
        {playlist.subtitle ? `${playlist.subtitle}. ` : ""}The best of {playlist.title} on Brisic. Fresh picks from emerging African artists, updated every week.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13.5px] text-ink/90">
        <span className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" width="17" height="17" fill="var(--primary)" aria-hidden="true"><path d="M9 18V5l11-2v13" stroke="var(--primary)" strokeWidth="2" fill="none" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>{tracks.length} Songs</span>
        <span className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--primary)" strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>{fmtLength(total)}</span>
        <span className="h-4 w-px bg-line" aria-hidden="true" />
        <span className="flex items-center gap-1.5"><Icon name="heart" size={16} fill className="text-primary" />Created for you</span>
      </div>

      <div className="relative mt-4 flex items-center gap-2.5">
        <button type="button" disabled={!tracks.length} onClick={() => (playingHere ? player.toggle() : player.playQueue(shown, 0))} className="btn btn-primary !h-12 flex-1 !px-6 text-[16px] sm:flex-none sm:!px-10">
          <Icon name={playingHere && player.playing ? "pause" : "play"} size={18} /> {playingHere && player.playing ? "Pause" : "Play"}
        </button>
        <button type="button" disabled={!tracks.length} onClick={() => player.playQueue([...shown].sort(() => Math.random() - 0.5), 0)} className="btn btn-outline !h-12 flex-1 !px-6 text-[16px] text-white sm:flex-none sm:!px-8">
          <Icon name="shuffle" size={18} /> Shuffle
        </button>
        <button
          type="button" aria-pressed={saved} aria-label={saved ? "Remove from Your Playlists" : "Save to Your Playlists"}
          onClick={async () => {
            setSaved((v) => !v);
            const r = await toggleSavedPlaylist(playlist.id).catch(() => null);
            if (!r || !r.ok) { setSaved((v) => !v); toast(r && !r.ok ? r.error : "Could not save. Check your connection."); return; }
            setSaved(r.saved);
            toast(r.saved ? "Saved to Your Playlists" : "Removed from Your Playlists");
          }}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent ${saved ? "text-primary" : "text-white"}`}
        >
          <Icon name="heart" size={22} fill={saved} />
        </button>
        <button type="button" aria-label="More options" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-white">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
        </button>
        {menu && (
          <>
            <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default border-0 bg-transparent" onClick={() => setMenu(false)} />
            <div role="menu" className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-xl">
              <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5" onClick={() => { shown.forEach((t) => player.enqueue(t)); toast(`Added ${shown.length} songs to your queue`); setMenu(false); }}>Add all to queue</button>
              <button
                role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5"
                onClick={async () => {
                  setMenu(false);
                  const url = location.href;
                  try {
                    if (navigator.share) await navigator.share({ title: playlist.title, url });
                    else { await navigator.clipboard.writeText(url); toast("Link copied"); }
                  } catch { /* share sheet closed */ }
                }}
              >
                Share playlist
              </button>
              <Link role="menuitem" href="/queue" className="block px-4 py-2.5 text-[14.5px] text-ink hover:bg-white/5">Open queue</Link>
            </div>
          </>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between border-b border-line-soft pb-2">
        <h2 className="m-0 text-[18px] font-semibold text-white">Playlist tracks</h2>
        <label className="relative flex items-center gap-1 text-[14px] text-ink">
          <span className="sr-only">Sort tracks</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="cursor-pointer appearance-none border-0 bg-transparent pr-6 text-right text-[14px] text-ink outline-none">
            {SORTS.map((s) => <option key={s.id} value={s.id} className="bg-[#0b0f0d]">{s.label}</option>)}
          </select>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="pointer-events-none absolute right-0"><path d="M6 9l6 6 6-6" /></svg>
        </label>
      </div>
      <div className="mt-1"><TrackList tracks={shown} numbered={false} showStreams={false} thumb={art.thumb} variant="playlist" /></div>
    </>
  );
}
