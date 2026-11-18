"use client";

import Link from "next/link";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { usePlayer } from "@/components/app-state";
import { fmtTime } from "@/lib/format";

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
