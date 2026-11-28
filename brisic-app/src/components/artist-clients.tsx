"use client";

import { useState } from "react";
import Link from "next/link";
import type { Track } from "@/lib/catalog/types";
import { useLibrary, usePlayer, useToast } from "@/components/app-state";
import { Icon } from "@/components/icons";

/** Play Artist / Follow(ing) / Support Artist pills from the design. */
export function ArtistActions({ artistId, artistName, tracks }: { artistId: string; artistName: string; tracks: Track[] }) {
  const p = usePlayer();
  const lib = useLibrary();
  const following = lib.followed.has(artistId);
  const pill = "flex h-10 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] border-primary px-2 text-[12.5px] font-semibold sm:flex-none sm:px-5 sm:text-[13.5px]";
  return (
    <div className="mt-4 flex gap-2">
      <button type="button" disabled={!tracks.length} onClick={() => p.playQueue(tracks, 0)} className={`${pill} bg-primary text-primary-ink shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)]`}>
        <Icon name="play" size={15} /> Play Artist
      </button>
      <button type="button" aria-pressed={following} onClick={() => lib.toggleFollow(artistId, artistName)} className={`${pill} bg-transparent text-accent`}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="8" r="4" />
          <path d="M2 21c0-4 3-6 7-6s7 2 7 6" />
          {following ? <path d="M16 11l2 2 4-4" /> : <path d="M19 8v6M16 11h6" />}
        </svg>
        {following ? "Following" : "Follow"}
      </button>
      <Link href={`/artist/${artistId}/support`} className={`${pill} text-white`}>
        <Icon name="gift" size={15} /> Support Artist
      </Link>
    </div>
  );
}

/** "Popular Songs" rows: music-note tile, title with E badge, stream count, options. */
export function ArtistSongs({ tracks }: { tracks: Track[] }) {
  const p = usePlayer();
  const lib = useLibrary();
  const [menu, setMenu] = useState<string | null>(null);
  return (
    <ol className="m-0 list-none p-0">
      {tracks.map((t, i) => {
        const current = p.current?.id === t.id;
        const liked = lib.liked.has(t.id);
        return (
          <li key={t.id} className="relative flex items-center gap-3 border-b border-white/[0.06] py-2">
            <button
              type="button" onClick={() => (current ? p.toggle() : p.playQueue(tracks, i))} aria-label={`Play ${t.title}`}
              className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 text-primary" style={{ background: "radial-gradient(circle at 50% 40%, #1f4a2a, #0b1a10)" }}>
                {current && p.playing ? <Icon name="pause" size={16} /> : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className={`truncate text-[15px] font-medium ${current ? "text-primary" : "text-white"}`}>{t.title}</span>
                  {t.explicit && <span aria-label="Explicit" className="shrink-0 rounded-[3px] bg-[#7a6ae0] px-1 text-[10px] font-bold leading-[15px] text-white">E</span>}
                </span>
                <span className="block text-[12.5px] font-light text-muted">{t.streams.toLocaleString("en-US")} {t.streams === 1 ? "stream" : "streams"}</span>
              </span>
            </button>
            <button type="button" aria-label="More options" aria-expanded={menu === t.id} onClick={() => setMenu(menu === t.id ? null : t.id)} className="shrink-0 border-0 bg-transparent p-2 text-muted hover:text-ink">
              <Icon name="more" size={20} />
            </button>
            {menu === t.id && (
              <>
                <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default border-0 bg-transparent" onClick={() => setMenu(null)} />
                <div role="menu" className="absolute right-2 top-12 z-50 w-52 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-xl">
                  <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5" onClick={() => { lib.toggleLike(t); setMenu(null); }}>{liked ? "Remove from Liked Songs" : "Add to Liked Songs"}</button>
                  <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5" onClick={() => { p.enqueue(t); setMenu(null); }}>Add to queue</button>
                  {t.albumId && <Link role="menuitem" href={`/album/${t.albumId}`} className="block px-4 py-2.5 text-[14.5px] text-ink hover:bg-white/5">Go to album</Link>}
                </div>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** ⋮ menu on the artist header: share and spotlight. */
export function ArtistMenu({ artistName }: { artistName: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label="More options" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-black/40 text-white">
        <Icon name="more" size={20} />
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default border-0 bg-transparent" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-11 z-50 w-48 overflow-hidden rounded-xl border border-line bg-card py-1 shadow-xl">
            <button
              role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5"
              onClick={async () => {
                setOpen(false);
                try {
                  if (navigator.share) await navigator.share({ title: artistName, url: location.href });
                  else { await navigator.clipboard.writeText(location.href); toast("Link copied"); }
                } catch { /* closed */ }
              }}
            >
              Share artist
            </button>
            <Link role="menuitem" href="/spotlight" className="block px-4 py-2.5 text-[14.5px] text-ink hover:bg-white/5">Artist Spotlight</Link>
          </div>
        </>
      )}
    </div>
  );
}

/** Outline Follow pill used on the Trending Artists list. */
export function TrendingFollow({ artistId, artistName }: { artistId: string; artistName: string }) {
  const lib = useLibrary();
  const on = lib.followed.has(artistId);
  return (
    <button
      type="button" aria-pressed={on} onClick={() => lib.toggleFollow(artistId, artistName)}
      className={`h-8 shrink-0 rounded-full border-[1.5px] border-primary px-4 text-[13px] font-semibold ${on ? "bg-primary text-primary-ink" : "bg-transparent text-accent"}`}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}
