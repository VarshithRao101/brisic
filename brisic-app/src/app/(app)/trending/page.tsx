import Link from "next/link";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import type { Artist } from "@/lib/catalog/types";
import { fmtCount } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { ArtistFace } from "@/components/cover";
import { TrendingFollow } from "@/components/artist-clients";
import { GoldBadge } from "@/components/ui";

export const metadata = { title: "Trending Artists · Brisic" };

// Plays in the chart window, from the catalog's listener numbers (sample data until the API).
const streamsFor = (a: Artist, period: "week" | "month") => Math.round(a.monthlyListeners * (period === "week" ? 0.075 : 0.32));

/** 3D podium block from the design: front, lit top and shaded side. */
function Block({ place, height }: { place: 1 | 2 | 3; height: number }) {
  const gold = place === 1;
  const [front, top, side, ink] = gold
    ? ["url(#pd-gold)", "#f6d66a", "#9a7410", "#fff6d8"]
    : ["url(#pd-blue)", "#7c97ff", "#1d2f86", "#eef2ff"];
  return (
    <svg viewBox={`0 0 112 ${height + 14}`} className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id="pd-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e9bd33" /><stop offset="1" stopColor="#b88a16" /></linearGradient>
        <linearGradient id="pd-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4d6de0" /><stop offset="1" stopColor="#24398f" /></linearGradient>
      </defs>
      <polygon points="0,14 14,0 112,0 98,14" fill={top} />
      <polygon points={`98,14 112,0 112,${height} 98,${height + 14}`} fill={side} />
      <rect x="0" y="14" width="98" height={height} fill={front} />
      <text x="49" y={14 + height / 2 + 16} textAnchor="middle" fontFamily="var(--font-outfit), sans-serif" fontWeight="700" fontSize="46" fill={ink}>{place}</text>
    </svg>
  );
}

function Podium({ a, place, period }: { a: Artist; place: 1 | 2 | 3; period: "week" | "month" }) {
  const first = place === 1;
  return (
    <div className={`flex flex-col items-center ${first ? "w-[38%]" : "w-[31%]"}`}>
      {first && (
        <svg viewBox="0 0 64 40" className="mb-1 w-14 drop-shadow-[0_0_10px_rgba(190,255,200,0.75)]" aria-hidden="true" fill="none" stroke="#c6f5cc" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
          <path d="M8 32 L4 10 L19 21 L32 4 L45 21 L60 10 L56 32 Z" />
          <path d="M8 37 H56" />
          <circle cx="4" cy="8" r="2.4" fill="#c6f5cc" /><circle cx="32" cy="3" r="2.4" fill="#c6f5cc" /><circle cx="60" cy="8" r="2.4" fill="#c6f5cc" />
        </svg>
      )}
      <Link href={`/artist/${a.id}`} aria-label={a.name} className={`block overflow-hidden rounded-[18px] p-[3px] ${first ? "w-[82%] bg-[#e8b830] shadow-[0_0_22px_rgba(232,184,48,0.55)]" : "w-[78%] bg-[#d9dee4] shadow-[0_0_12px_rgba(220,225,230,0.3)]"}`}>
        <ArtistFace seed={a.id} className="block aspect-square w-full rounded-[15px]" />
      </Link>
      <p className="m-0 mt-2 flex max-w-full items-center gap-1 text-[13px] font-semibold text-white">
        <span className="truncate">{a.name}</span><GoldBadge size={14} />
      </p>
      <p className="m-0 mb-1.5 text-[11.5px] text-ink/80">{fmtCount(streamsFor(a, period))} streams</p>
      <Block place={place} height={first ? 150 : place === 2 ? 118 : 96} />
    </div>
  );
}

export default async function TrendingPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await getUserId();
  const period = (await searchParams).p === "month" ? "month" : "week";
  const [artists, other] = await Promise.all([
    catalog.getTrendingArtists(period),
    catalog.getTrendingArtists(period === "week" ? "month" : "week"),
  ]);
  const top = artists.slice(0, 20);
  // Movement: places gained or lost compared with the other chart window.
  const moved = (a: Artist, i: number) => {
    const j = other.findIndex((x) => x.id === a.id);
    return j < 0 ? 0 : j - i;
  };
  const [one, two, three] = top;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="mb-3">
          <h1 className="m-0 flex items-center gap-2 text-[24px] font-bold text-white">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>
            Trending Artists
          </h1>
          <p className="m-0 text-[12.5px] font-light text-muted">Top 20 · most played in the last {period === "week" ? "7" : "30"} days</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-full border border-line p-1">
        {(["week", "month"] as const).map((p) => (
          <Link key={p} href={p === "week" ? "/trending" : "/trending?p=month"} scroll={false} aria-current={period === p ? "page" : undefined}
            className={`flex h-10 items-center justify-center rounded-full text-[14.5px] ${period === p ? "bg-primary font-semibold text-primary-ink" : "text-ink"}`}>
            {p === "week" ? "This week" : "This month"}
          </Link>
        ))}
      </div>

      {one && two && three && (
        <div className="mt-6 flex items-end justify-center gap-[2%] px-1">
          <Podium a={two} place={2} period={period} />
          <Podium a={one} place={1} period={period} />
          <Podium a={three} place={3} period={period} />
        </div>
      )}

      <ol className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
        {top.slice(3).map((a, k) => {
          const i = k + 3;
          const m = moved(a, i);
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)" }}>
              <span className="w-6 shrink-0 text-center text-[17px] font-semibold tabular-nums text-muted">{i + 1}</span>
              <Link href={`/artist/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary p-[2px] shadow-[0_0_8px_rgba(var(--primary-rgb),0.35)]">
                  <ArtistFace seed={a.id} className="h-full w-full rounded-full" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[16px] font-semibold text-white"><span className="truncate">{a.name}</span><GoldBadge size={15} /></span>
                  <span className="block text-[12.5px] font-light text-ink/80">
                    {fmtCount(streamsFor(a, period))} streams
                    {m !== 0 && <span className={m > 0 ? "text-primary" : "text-[#ff6b6b]"}> · {m > 0 ? "▲" : "▼"} {Math.abs(m)}</span>}
                  </span>
                </span>
              </Link>
              <TrendingFollow artistId={a.id} artistName={a.name} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
