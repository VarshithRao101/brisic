"use client";

import { useEffect, useState } from "react";
import type { SpotlightItem } from "@/lib/catalog/types";
import { Icon } from "@/components/icons";
import { SpotlightPoster } from "@/components/spotlight";
import { fmtTime } from "@/lib/format";

/**
 * Spotlight video player. Plays the real video when the media API provides one;
 * until then it shows the poster with a preview timeline and says so.
 */
export function SpotlightPlayer({ item }: { item: SpotlightItem }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const total = item.durationSec;

  useEffect(() => {
    if (!playing || item.mediaUrl) return;
    const t = setInterval(() => {
      setPos((p) => {
        if (total && p + 1 >= total) { setPlaying(false); return total; }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, total, item.mediaUrl]);

  if (item.mediaUrl) {
    return <video src={item.mediaUrl} poster={item.poster ?? undefined} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />;
  }

  const pct = total ? (pos / total) * 100 : 100;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      <SpotlightPoster seed={item.artistId} className="aspect-video w-full" />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause" : "Play"}
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 text-white backdrop-blur-sm"
      >
        <Icon name={playing ? "pause" : "play"} size={26} className={playing ? "" : "ml-1"} />
      </button>
      {item.kind === "Live" && (
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-[#e02a2a] px-2 py-0.5 text-[11px] font-bold text-white"><span className="h-1.5 w-1.5 rounded-full bg-white" />LIVE</span>
      )}
      <div className="absolute inset-x-3 bottom-2">
        <div className="h-1 overflow-hidden rounded-full bg-white/25">
          <div className="h-full bg-primary" style={{ width: pct + "%" }} />
        </div>
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-white/85">
          <span>{fmtTime(pos)}</span>
          <span>{item.kind === "Live" ? "Live" : fmtTime(total)}</span>
        </div>
      </div>
      {playing && (
        <p className="absolute inset-x-0 top-3 m-0 text-center text-[11.5px] text-white/80">Preview · the video streams once the media source is connected</p>
      )}
    </div>
  );
}
