import type { CoverArt } from "@/lib/catalog/types";
import { hashStr } from "@/lib/format";

// [from, to, label color] — the prototype's poster palette.
const PALETTE: [string, string, string][] = [
  ["#e08a3a", "#5a2a10", "#ffffff"], ["#2a8a8a", "#0c2a30", "#ffffff"], ["#f07a2a", "#8a2a0a", "#ffffff"],
  ["#9a5ab8", "#2a0f45", "#ffffff"], ["#2a5ac8", "#0c1a5a", "#ffffff"], ["#2f7a34", "#10381a", "#f2c94c"],
  ["#e8562a", "#7d1f0a", "#f6e0a2"], ["#c0309a", "#4a0f55", "#ffffff"], ["#d6841a", "#5a2a08", "#ffffff"],
  ["#4a4d4b", "#0d0f0e", "#f2c94c"], ["#e02a2a", "#6a0a0a", "#ffffff"], ["#1e6f86", "#0f4a60", "#69d8c8"],
  ["#f2a62a", "#b36a0a", "#2a1a05"], ["#6a8ae0", "#1a2a6a", "#ffffff"], ["#4c9a3e", "#1a3a14", "#f2c94c"],
  ["#1c6be0", "#0a2a7a", "#ffffff"],
];

const SKIN = ["#7a4a34", "#5a3424", "#8a5a3c", "#3f2418", "#a06a48"];
const HAIR = ["#0d0807", "#1a1210", "#2a1a10", "#050505"];
const CLOTH = ["#1b1512", "#1f3a28", "#3a1a2a", "#1a2a4a", "#3a2a12"];

/** Splits a title into at most three short poster lines: "Afro Hits" → "AFRO\nHITS". */
function posterLines(label: string) {
  const words = label.toUpperCase().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last && (last + " " + w).length <= 8 && lines.length >= 2) lines[lines.length - 1] = last + " " + w;
    else lines.push(w);
  }
  if (lines.length > 3) return [...lines.slice(0, 2), lines.slice(2).join(" ")];
  return lines;
}

/** Illustrated person used for artists (no real photo yet). */
export function ArtistFace({ seed, className = "" }: { seed: string; className?: string }) {
  const h = hashStr(seed);
  const [a, b] = PALETTE[h % PALETTE.length];
  const skin = SKIN[h % SKIN.length];
  const hair = HAIR[(h >> 3) % HAIR.length];
  const cloth = CLOTH[(h >> 5) % CLOTH.length];
  const shades = h % 4 === 0;
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`fg-${seed}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="60" height="60" fill={`url(#fg-${seed})`} />
      <path d="M6 60 C6 46 18 42 30 42 C42 42 54 46 54 60 Z" fill={cloth} />
      <rect x="25" y="34" width="10" height="11" rx="4" fill={skin} />
      <ellipse cx="30" cy="26" rx="11.5" ry="14" fill={skin} />
      <path d="M18 24 C17 11 24 8 30 8 C36 8 43 11 42 24 C39 18 36 16 30 16 C24 16 21 18 18 24 Z" fill={hair} />
      {shades && (
        <>
          <rect x="20" y="23" width="9" height="6" rx="2.5" fill="#050505" />
          <rect x="31" y="23" width="9" height="6" rx="2.5" fill="#050505" />
        </>
      )}
    </svg>
  );
}

/**
 * Poster card drawn exactly like the prototype's home cards: gradient, Bebas label
 * top-left (or a soft label on large cards) and an optional figure.
 */
export function ArtCover({ art, className = "" }: { art: CoverArt; className?: string }) {
  const soft = !!art.soft;
  // Prototype sizes are in px on a 176px card (252px for large ones), times 1.4.
  const base = soft ? 252 : 176;
  const lines = (art.label ?? "").split("\n");
  const longest = Math.max(1, ...lines.map((l) => l.length));
  let size = ((art.size ?? (soft ? 20 : 30)) * 1.4 * 100) / base;
  if (!soft && longest > 8) size = Math.min(size, (88 / (longest * 0.47)));
  const px = art.px ?? 80;
  const fill = art.pfill ?? "#0b0b0b";
  const person = (vb: number, cy: number, top: number) => (
    <svg viewBox={`0 0 125 ${vb}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx={px} cy={cy} r={soft ? 16 : 15} fill={fill} />
      <path d={`M${px - 34} ${vb} C${px - 34} ${top + 12} ${px - 20} ${top} ${px} ${top} C${px + 20} ${top} ${px + 34} ${top + 12} ${px + 34} ${vb} Z`} fill={fill} />
    </svg>
  );
  return (
    <div
      aria-hidden="true"
      className={`poster-box relative w-full overflow-hidden rounded-2xl border border-white/10 [container-type:inline-size] ${soft ? "aspect-[252/280]" : "aspect-[176/162]"} ${className}`}
      style={{ background: art.bg ?? `linear-gradient(${art.angle ?? 150}deg, ${art.from}, ${art.to})` }}
    >
      {art.figure === "person" && person(98, 40, 58)}
      {art.figure === "stars" && (
        <>
          <svg viewBox="0 0 125 104" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {[[14, 12, 0.9], [40, 30, 0.8], [78, 14, 1], [108, 26, 0.8], [96, 50, 0.9], [26, 58, 0.8], [60, 8, 0.7]].map(([cx, cy, r]) => <circle key={cx} cx={cx} cy={cy} r={r} fill="#cfe0ff" />)}
          </svg>
          {person(104, 52, 70)}
        </>
      )}
      {art.figure === "palm" && (
        <svg viewBox="0 0 125 98" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M98 98 Q100 60 104 28" stroke="#0b2b2b" strokeWidth="3" fill="none" />
          <path d="M104 28 Q88 20 78 30 M104 28 Q96 12 82 12 M104 28 Q112 12 124 16 M104 28 Q118 26 124 38" stroke="#0b2b2b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M0 98 L0 84 Q30 74 60 86 Q90 76 125 88 L125 98 Z" fill="#0c3a46" />
        </svg>
      )}
      {art.figure === "heart" && (
        <svg viewBox="0 0 125 102" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M62 62 C40 46 32 36 36 24 C40 14 54 14 62 26 C70 14 84 14 88 24 C92 36 84 46 62 62 Z" fill="#4c9a3e" stroke="#8fd27a" strokeWidth="1.5" opacity="0.9" />
        </svg>
      )}
      {art.label && (
        <span
          className={`poster-label absolute whitespace-pre-line ${soft ? "font-light leading-[1.2]" : "display"}`}
          style={{ color: art.ink ?? "#ffffff", fontSize: size.toFixed(2) + "cqw", left: soft ? "4.4cqw" : "6.25cqw", top: soft ? "4cqw" : "6.25cqw" }}
        >
          {art.label}
        </span>
      )}
    </div>
  );
}

/**
 * Square (or round) artwork. Uses the image when the catalog provides one,
 * otherwise a poster-style cover: gradient, block title and a silhouette.
 * Round covers are artist portraits with a glowing ring.
 */
export function Cover({
  seed, label, src, round, className = "", ring = true, art,
}: {
  seed: string; label?: string; src?: string | null; round?: boolean; className?: string; ring?: boolean; art?: CoverArt;
}) {
  const h = hashStr(seed);
  if (art && !src && !round) return <ArtCover art={art} className={className} />;
  if (round) {
    return (
      <div className={`relative aspect-square w-full rounded-full p-[3px] ${ring ? "ring-glow cover-round" : ""} ${className}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" loading="lazy" className="h-full w-full rounded-full object-cover" />
        ) : (
          <ArtistFace seed={seed} className="h-full w-full rounded-full" />
        )}
      </div>
    );
  }
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={`aspect-square w-full rounded-2xl object-cover ${className}`} />;
  }
  const [a, b, ink] = PALETTE[h % PALETTE.length];
  const figure = (h >> 4) % 3; // 0 person, 1 person left, 2 none
  const lines = label ? posterLines(label) : [];
  return (
    <div
      aria-hidden="true"
      className={`poster-box relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10 [container-type:inline-size] ${className}`}
      style={{ background: `linear-gradient(150deg, ${a}, ${b})` }}
    >
      {figure !== 2 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
          <circle cx={figure === 0 ? 68 : 34} cy="52" r="14" fill="#0b0b0b" opacity="0.92" />
          <path
            d={figure === 0 ? "M38 100 C38 76 52 68 68 68 C84 68 98 76 98 100 Z" : "M4 100 C4 76 18 68 34 68 C50 68 64 76 64 100 Z"}
            fill="#0b0b0b"
            opacity="0.92"
          />
        </svg>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(255,255,255,0.16),transparent_60%)]" />
      {lines.length > 0 && (
        <span
          className="display poster-label absolute left-[7%] top-[6%] right-[7%] whitespace-pre-line"
          style={{ color: ink, fontSize: Math.min(lines.length > 2 ? 17 : 21, 84 / (Math.max(...lines.map((l) => l.length)) * 0.5)).toFixed(1) + "cqw" }}
        >
          {lines.join("\n")}
        </span>
      )}
    </div>
  );
}
