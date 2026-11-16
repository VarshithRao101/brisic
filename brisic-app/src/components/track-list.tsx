"use client";

import { useState } from "react";
import Link from "next/link";
import type { Track } from "@/lib/catalog/types";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { useLibrary, usePlayer } from "@/components/app-state";
import { fmtCount, fmtTime } from "@/lib/format";

/** Play and Shuffle buttons for a list of tracks. */
export function PlayButtons({ tracks, label = "Play" }: { tracks: Track[]; label?: string }) {
  const p = usePlayer();
  if (!tracks.length) return null;
  return (
    <div className="flex items-center gap-2.5">
      <button type="button" className="btn btn-primary" onClick={() => p.playQueue(tracks, 0)}>
        <Icon name="play" size={18} /> {label}
      </button>
      <button
        type="button" className="btn"
        onClick={() => p.playQueue([...tracks].sort(() => Math.random() - 0.5), 0)}
      >
        <Icon name="shuffle" size={18} /> Shuffle
      </button>
    </div>
  );
}

function PlaylistPicker({ track, onClose }: { track: Track; onClose: () => void }) {
  const lib = useLibrary();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-label="Add to playlist" className="panel w-full max-w-md rounded-b-none bg-[#0b1a11] p-5 sm:rounded-b-[20px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="m-0 text-lg font-semibold text-white">Add to playlist</h3>
        <p className="mt-0.5 truncate text-sm font-light text-muted">{track.title} · {track.artistName}</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim() || busy) return;
            setBusy(true);
            const created = await lib.newPlaylist(name);
            if (created) await lib.addTo(created.id, track);
            setBusy(false);
            if (created) onClose();
          }}
        >
          <input className="field !h-11" placeholder="New playlist name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          <button className="btn btn-primary shrink-0" disabled={!name.trim() || busy}>Create</button>
        </form>
        <ul className="m-0 mt-3 max-h-64 list-none overflow-y-auto p-0">
          {lib.playlists.length === 0 && <li className="py-3 text-sm font-light text-muted">You have no playlists yet. Create one above.</li>}
          {lib.playlists.map((pl) => (
            <li key={pl.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border-0 bg-transparent px-2 py-2.5 text-left text-[15px] text-ink hover:bg-white/5"
                onClick={async () => { await lib.addTo(pl.id, track); onClose(); }}
              >
                <span className="w-9 shrink-0"><Cover seed={pl.id} className="!rounded-md" /></span>
                <span className="truncate">{pl.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="btn mt-3 w-full" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/** A list of songs. Tapping a row plays the list from that song. */
export function TrackList({
  tracks, numbered = true, showStreams = true, onRemove,
}: {
  tracks: Track[]; numbered?: boolean; showStreams?: boolean; onRemove?: (trackId: string) => void;
}) {
  const p = usePlayer();
  const lib = useLibrary();
  const [menu, setMenu] = useState<string | null>(null);
  const [picking, setPicking] = useState<Track | null>(null);

  if (!tracks.length) return <p className="py-6 text-sm font-light text-muted">No songs here yet.</p>;

  return (
    <>
      <ol className="m-0 list-none p-0">
        {tracks.map((t, i) => {
          const isCurrent = p.current?.id === t.id;
          const likedNow = lib.liked.has(t.id);
          return (
            <li key={t.id + i} className={`group relative flex items-center gap-3 rounded-xl px-2 py-2 ${isCurrent ? "bg-white/[0.07]" : "hover:bg-white/5"}`}>
              <button
                type="button"
                aria-label={`Play ${t.title} by ${t.artistName}`}
                onClick={() => (isCurrent ? p.toggle() : p.playQueue(tracks, i))}
                className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left"
              >
                {numbered && (
                  <span className={`w-6 shrink-0 text-center text-[13.5px] tabular-nums ${isCurrent ? "text-player" : "text-muted"}`}>
                    {isCurrent ? <Icon name={p.playing ? "pause" : "play"} size={14} className="mx-auto" /> : i + 1}
                  </span>
                )}
                <span className="w-11 shrink-0"><Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" /></span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[15px] font-medium ${isCurrent ? "text-player" : "text-white"}`}>{t.title}</span>
                  <span className="block truncate text-[13px] font-light text-muted">{t.artistName}</span>
                </span>
              </button>
              {showStreams && <span className="hidden w-24 shrink-0 text-right text-[13px] font-light tabular-nums text-muted md:block">{fmtCount(t.streams)} streams</span>}
              <span className="hidden w-10 shrink-0 text-right text-[13px] tabular-nums text-muted sm:block">{fmtTime(t.durationSec)}</span>
              <button type="button" aria-label={likedNow ? "Remove from Liked Songs" : "Add to Liked Songs"} aria-pressed={likedNow} onClick={() => lib.toggleLike(t)} className={`shrink-0 border-0 bg-transparent p-1.5 ${likedNow ? "text-primary" : "text-muted hover:text-ink"}`}>
                <Icon name="heart" size={19} fill={likedNow} />
              </button>
              <button type="button" aria-label="More options" aria-expanded={menu === t.id} onClick={() => setMenu(menu === t.id ? null : t.id)} className="shrink-0 border-0 bg-transparent p-1.5 text-muted hover:text-ink">
                <Icon name="more" size={20} />
              </button>
              {menu === t.id && (
                <>
                  <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default border-0 bg-transparent" onClick={() => setMenu(null)} />
                  <div role="menu" className="absolute right-2 top-12 z-50 w-52 overflow-hidden rounded-xl border border-line bg-[#0f2318] py-1 shadow-xl">
                    <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5" onClick={() => { p.enqueue(t); setMenu(null); }}>Add to queue</button>
                    <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-ink hover:bg-white/5" onClick={() => { setPicking(t); setMenu(null); }}>Add to playlist</button>
                    <Link role="menuitem" href={`/artist/${t.artistId}`} className="block px-4 py-2.5 text-[14.5px] text-ink hover:bg-white/5">Go to artist</Link>
                    {t.albumId && <Link role="menuitem" href={`/album/${t.albumId}`} className="block px-4 py-2.5 text-[14.5px] text-ink hover:bg-white/5">Go to album</Link>}
                    {onRemove && (
                      <button role="menuitem" type="button" className="block w-full border-0 bg-transparent px-4 py-2.5 text-left text-[14.5px] text-[#ff9b9b] hover:bg-white/5" onClick={() => { onRemove(t.id); setMenu(null); }}>Remove from this playlist</button>
                    )}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {picking && <PlaylistPicker track={picking} onClose={() => setPicking(null)} />}
    </>
  );
}
