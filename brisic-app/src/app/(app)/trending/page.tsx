import Image from "next/image";
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

// Reveal order: 3rd, then 2nd, then 1st, then the crown (seconds).
const DELAY = { 3: 0.25, 2: 1.05, 1: 1.85 } as const;
const CROWN_AT = 2.75;

function Podium({ a, place, period }: { a: Artist; place: 1 | 2 | 3; period: "week" | "month" }) {
  const first = place === 1;
  return (
    <div className={`podium-rise relative flex flex-col items-center ${first ? "w-[38%]" : "w-[31%]"}`} style={{ animationDelay: `${DELAY[place]}s` }}>
      {first && (
        <>
          {/* Spotlight on the winner */}
          <span aria-hidden="true" className="spotlight-on pointer-events-none absolute -top-16 left-1/2 -z-10 h-[150%] w-[150%] -translate-x-1/2" style={{ animationDelay: `${CROWN_AT - 0.2}s`, background: "radial-gradient(45% 55% at 50% 0%, rgba(255,236,170,0.28), transparent 70%)" }} />
          <Image
            src="/assets/crown.png" alt="Number one" width={256} height={256}
            className="crown-drop -mb-2 w-[92px] drop-shadow-[0_0_10px_rgba(140,255,170,0.95)] [filter:drop-shadow(0_0_6px_rgba(140,255,170,0.9))_drop-shadow(0_0_16px_rgba(140,255,170,0.6))_brightness(1.25)] sm:w-[104px]"
            style={{ animationDelay: `${CROWN_AT}s` }}
          />
        </>
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
        <div key={period} className="relative isolate mt-6 flex items-end justify-center gap-[2%] px-1">
          <Podium a={two} place={2} period={period} />
          <Podium a={one} place={1} period={period} />
          <Podium a={three} place={3} period={period} />
        </div>
      )}

      <ol key={period} className="m-0 mt-5 flex list-none flex-col gap-2.5 p-0">
        {top.slice(3).map((a, k) => {
          const i = k + 3;
          const m = moved(a, i);
          return (
            <li key={a.id} className="fade-up flex items-center gap-3 rounded-2xl border border-line px-3 py-2.5" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", animationDelay: `${CROWN_AT + 0.4 + k * 0.06}s` }}>
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
