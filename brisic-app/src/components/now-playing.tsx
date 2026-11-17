"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TrackDetails } from "@/lib/catalog/types";
import { fetchTrackDetails } from "@/app/actions";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { useLibrary, usePlayer } from "@/components/app-state";
import { FollowButton } from "@/components/controls";
import { Empty } from "@/components/ui";
import { fmtCount, fmtTime } from "@/lib/format";

export function NowPlaying() {
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.current;
  const [loaded, setLoaded] = useState<{ id: string; data: TrackDetails | null } | null>(null);
  const trackId = t?.id;
  // Only show details that belong to the current song.
  const details = loaded && loaded.id === trackId ? loaded.data : null;

  useEffect(() => {
    if (!trackId) return;
    let live = true;
    fetchTrackDetails(trackId).then((d) => { if (live) setLoaded({ id: trackId, data: d }); }).catch(() => {});
    return () => { live = false; };
  }, [trackId]);

  if (!t) {
    return (
      <Empty
        title="Nothing is playing"
        body="Pick a song, playlist or station and it will show up here."
        action={<Link href="/" className="btn btn-primary">Browse music</Link>}
      />
    );
  }
  const likedNow = lib.liked.has(t.id);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
      <div className="mx-auto w-full max-w-[420px]">
        <div className="rounded-[28px] p-1" style={{ boxShadow: "0 0 80px -20px var(--player)" }}>
          <Cover seed={t.albumId ?? t.id} label={t.title} src={t.artwork} />
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="m-0 truncate text-[24px] font-semibold text-white">{t.title}</h1>
            <Link href={`/artist/${t.artistId}`} className="text-[15.5px] text-muted hover:text-ink hover:underline">{t.artistName}</Link>
          </div>
          <button type="button" aria-label={likedNow ? "Remove from Liked Songs" : "Add to Liked Songs"} aria-pressed={likedNow} onClick={() => lib.toggleLike(t)} className={`shrink-0 border-0 bg-transparent p-2 ${likedNow ? "text-primary" : "text-muted"}`}>
            <Icon name="heart" size={26} fill={likedNow} />
          </button>
        </div>

        <input
          type="range" aria-label="Seek" min={0} max={t.durationSec} value={Math.min(p.position, t.durationSec)}
          onChange={(e) => p.seek(Number(e.target.value))}
          className="mt-4 h-1.5 w-full cursor-pointer" style={{ accentColor: "var(--player)" }}
        />
        <div className="mt-1 flex justify-between text-[12.5px] tabular-nums text-muted">
          <span>{fmtTime(p.position)}</span>
          <span>-{fmtTime(Math.max(0, t.durationSec - p.position))}</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button type="button" aria-label="Shuffle" aria-pressed={p.shuffle} onClick={p.toggleShuffle} className={`border-0 bg-transparent p-2.5 ${p.shuffle ? "text-player" : "text-muted"}`}><Icon name="shuffle" size={22} /></button>
          <button type="button" aria-label="Previous" onClick={p.prev} className="border-0 bg-transparent p-2.5 text-white"><Icon name="prev" size={30} /></button>
          <button type="button" aria-label={p.playing ? "Pause" : "Play"} onClick={p.toggle} className="flex h-[68px] w-[68px] items-center justify-center rounded-full border-0 bg-player text-black">
            <Icon name={p.playing ? "pause" : "play"} size={32} />
          </button>
          <button type="button" aria-label="Next" onClick={p.next} className="border-0 bg-transparent p-2.5 text-white"><Icon name="next" size={30} /></button>
          <Link href="/queue" aria-label="Queue" className="p-2.5 text-muted hover:text-ink"><Icon name="queue" size={22} /></Link>
        </div>

        {!p.hasAudio && (
          <p className="m-0 mt-4 rounded-xl border border-line bg-white/[0.04] px-3.5 py-2.5 text-center text-[12.5px] font-light text-muted">
            No sound yet: this song has no audio source. Audio plays once the Global Tune API is connected.
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        {details && details.lyrics.length > 0 && (
          <section className="panel p-5">
            <h2 className="m-0 text-[17px] font-semibold text-white">Lyrics</h2>
            <div className="mt-3 text-[17px] leading-relaxed text-ink/90">
              {details.lyrics.map((l, i) => (
                <p key={i} className="m-0">
                  {l.section && <span className="mb-1 mt-4 block text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent first:mt-0">{l.section}</span>}
                  {l.text}
                </p>
              ))}
            </div>
          </section>
        )}

        <section className="panel p-5">
          <h2 className="m-0 text-[17px] font-semibold text-white">About the song</h2>
          {details?.about && <p className="m-0 mt-2 text-[14.5px] font-light leading-relaxed text-ink/90">{details.about}</p>}
          <dl className="m-0 mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-[14px]">
            {(details?.credits ?? []).map((c) => (
              <div key={c.label} className="contents">
                <dt className="font-light text-muted">{c.label}</dt>
                <dd className="m-0 text-ink">{c.value}</dd>
              </div>
            ))}
            {t.streams > 0 && (
              <div className="contents">
                <dt className="font-light text-muted">Streams</dt>
                <dd className="m-0 text-ink">{fmtCount(t.streams)}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="panel flex flex-wrap items-center gap-4 p-5">
          <span className="w-16 shrink-0"><Cover seed={t.artistId} label={t.artistName} round /></span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">About the artist</p>
            <p className="m-0 truncate text-[18px] font-semibold text-white">{t.artistName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <FollowButton artistId={t.artistId} artistName={t.artistName} small />
            <Link href={`/artist/${t.artistId}`} className="btn btn-sm">View profile</Link>
            <Link href={`/artist/${t.artistId}/support`} className="btn btn-sm">Support</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export function QueueView() {
  const p = usePlayer();
  const t = p.current;
  const upNext = p.queue.slice(p.index + 1);

  return (
    <>
      <h2 className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Now playing</h2>
      {t ? (
        <div className="panel mt-2 flex items-center gap-3.5 p-3">
          <span className="w-14 shrink-0"><Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" /></span>
          <div className="min-w-0 flex-1">
            <p className="m-0 truncate text-[16px] font-semibold text-player">{t.title}</p>
            <p className="m-0 truncate text-[13.5px] font-light text-muted">{t.artistName}</p>
          </div>
          <Link href="/player" className="btn btn-sm">Open</Link>
        </div>
      ) : (
        <p className="mt-2 text-sm font-light text-muted">Nothing is playing.</p>
      )}

      <div className="mt-7 flex items-center justify-between">
        <h2 className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Up next · {upNext.length}</h2>
        {upNext.length > 0 && <button type="button" className="btn btn-sm" onClick={p.clearUpNext}>Clear queue</button>}
      </div>
      {upNext.length === 0 ? (
        <p className="mt-3 text-sm font-light text-muted">Your queue is empty. Add songs from a playlist or use “Add to queue” on any song.</p>
      ) : (
        <ol className="m-0 mt-2 list-none p-0">
          {upNext.map((q, n) => {
            const i = p.index + 1 + n;
            return (
              <li key={q.id + i} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5">
                <button type="button" aria-label={`Play ${q.title}`} onClick={() => p.jump(i)} className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent p-0 text-left">
                  <span className="w-11 shrink-0"><Cover seed={q.albumId ?? q.id} src={q.artwork} className="!rounded-lg" /></span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-medium text-white">{q.title}</span>
                    <span className="block truncate text-[13px] font-light text-muted">{q.artistName}</span>
                  </span>
                </button>
                <span className="hidden text-[13px] tabular-nums text-muted sm:block">{fmtTime(q.durationSec)}</span>
                <button type="button" aria-label={`Remove ${q.title} from queue`} onClick={() => p.removeAt(i)} className="border-0 bg-transparent p-1.5 text-muted hover:text-ink"><Icon name="x" size={18} /></button>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}
