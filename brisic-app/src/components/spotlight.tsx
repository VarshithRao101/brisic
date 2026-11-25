import Link from "next/link";
import type { SpotlightItem } from "@/lib/catalog/types";
import { Icon } from "@/components/icons";
import { fmtCount, fmtTime, hashStr } from "@/lib/format";
import { youtubeThumb } from "@/lib/youtube";

// Stage-light backdrops behind the silhouette. "theme" follows the user's theme color.
const STAGES = [
  "radial-gradient(70% 60% at 60% 35%, rgba(var(--primary-rgb),0.85), rgba(var(--primary-rgb),0.15) 45%, #050806 80%)",
  "radial-gradient(70% 60% at 40% 30%, #c98a3a, #3a2010 50%, #070504 85%)",
  "radial-gradient(70% 60% at 55% 30%, #6a5ae0, #1a1050 50%, #05040c 85%)",
  "radial-gradient(70% 60% at 50% 30%, #8a8f8c, #2a2d2b 50%, #060606 85%)",
  "radial-gradient(70% 60% at 45% 35%, #d64a8a, #3a0f2a 50%, #070306 85%)",
];

/** Silhouette of an artist (afro, cap or locs) cut out against a stage light. */
export function SpotlightPoster({ seed, className = "", youtubeId }: { seed: string; className?: string; youtubeId?: string | null }) {
  // Real videos show their YouTube thumbnail.
  if (youtubeId) {
    return (
      <div aria-hidden="true" className={`relative overflow-hidden bg-black ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={youtubeThumb(youtubeId)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  const h = hashStr(seed);
  const style = h % 3;
  return (
    <div aria-hidden="true" className={`relative overflow-hidden ${className}`} style={{ background: STAGES[h % STAGES.length] }}>
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        {style === 0 && <circle cx="104" cy="78" r="46" fill="#030303" />}
        {style === 1 && <path d="M58 70 Q100 30 150 66 L156 76 Q120 70 96 74 Z" fill="#030303" />}
        {style === 2 && <path d="M64 70 Q60 120 70 136 M144 70 Q150 120 140 136" stroke="#030303" strokeWidth="9" strokeLinecap="round" fill="none" />}
        <ellipse cx="104" cy="92" rx="30" ry="36" fill="#030303" />
        <rect x="90" y="118" width="28" height="26" rx="10" fill="#030303" />
        <path d="M30 200 C30 158 64 140 104 140 C144 140 178 158 178 200 Z" fill="#030303" />
      </svg>
    </div>
  );
}

export const kindLabel = (i: SpotlightItem) => (i.kind === "Live" ? "LIVE" : i.kind.toUpperCase());
export const spotLength = (i: SpotlightItem) => (i.kind === "Live" ? "Live" : fmtTime(i.durationSec));

/** Large featured card ("KELECHI ADE · WATCH NOW"). */
export function FeaturedSpotlight({ item, badge = "SPOTLIGHT" }: { item: SpotlightItem; badge?: string }) {
  return (
    <div className="panel-glow relative w-[300px] shrink-0 overflow-hidden !rounded-3xl sm:w-[360px] lg:w-auto">
      <SpotlightPoster seed={item.artistId} youtubeId={item.youtubeId} className="h-[230px] w-full sm:h-[260px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <span className="absolute left-3 top-3 rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold tracking-wider text-primary-ink">{badge}</span>
      <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/40 text-white"><Icon name="video" size={17} /></span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="display m-0 text-[42px] text-primary drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.5)]">{item.artistName.toUpperCase()}</p>
        <p className="m-0 text-[13px] text-white/85">{item.title} · {item.kind}</p>
        <div className="mt-3 flex gap-2">
          <Link href={`/artist/${item.artistId}`} className="flex h-9 flex-1 items-center justify-center rounded-lg border border-white/70 text-[12.5px] font-bold uppercase tracking-wider text-white">Artist info</Link>
          <Link href={`/spotlight/${item.id}`} className="flex h-9 flex-1 items-center justify-center rounded-lg bg-primary text-[12.5px] font-bold uppercase tracking-wider text-primary-ink">Watch now</Link>
        </div>
      </div>
    </div>
  );
}

/** Video tile with duration and play mark. */
export function SpotlightTile({ item, fluid }: { item: SpotlightItem; fluid?: boolean }) {
  return (
    <Link href={`/spotlight/${item.id}`} className={`group block ${fluid ? "" : "w-[200px] shrink-0 sm:w-[220px] lg:w-auto"}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 transition group-hover:-translate-y-0.5">
        <SpotlightPoster seed={item.id} youtubeId={item.youtubeId} className="aspect-video w-full" />
        <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
          {item.kind === "Live" ? <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#ff4a4a]" />LIVE</span> : spotLength(item)}
        </span>
        <span className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/90 bg-black/40 text-white">
          <Icon name="play" size={13} className="ml-0.5" />
        </span>
      </div>
      <p className="m-0 mt-2 truncate text-[14.5px] text-ink">{item.title}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{item.artistName} · {fmtCount(item.views)} views</p>
    </Link>
  );
}

/** Portrait card for the home shelf ("KELECHI ADE / Emerging Afrobeats Artist"). */
export function SpotlightCard({ item, genre }: { item: SpotlightItem; genre?: string }) {
  const [first, ...rest] = item.artistName.toUpperCase().split(" ");
  return (
    <Link href={`/spotlight/${item.id}`} className="group block w-[156px] shrink-0 sm:w-[176px] lg:w-auto">
      <div className="poster relative overflow-hidden rounded-2xl border border-white/10 transition group-hover:-translate-y-0.5">
        <SpotlightPoster seed={item.artistId} youtubeId={item.youtubeId} className="aspect-[4/5] w-full" />
        <span className="display poster-label absolute left-2.5 top-2.5 whitespace-pre-line text-[34px] text-white">{[first, rest.join(" ")].filter(Boolean).join("\n")}</span>
        <span aria-hidden="true" className="play-ring absolute bottom-2 right-2 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-primary bg-black/55 text-[#e9f2ec]">
          <Icon name="play" size={15} className="ml-0.5" />
        </span>
      </div>
      <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{item.artistName}</p>
      <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">{genre ? `Emerging ${genre} Artist` : item.title}</p>
    </Link>
  );
}
