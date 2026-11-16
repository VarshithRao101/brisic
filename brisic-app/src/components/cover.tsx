import { hashStr } from "@/lib/format";

const PALETTE: [string, string][] = [
  ["#2f7a34", "#0c2a14"], ["#7a2a8a", "#240d3b"], ["#d6841a", "#4a2206"], ["#1c6be0", "#081f5c"],
  ["#c0309a", "#3d0c47"], ["#1f9a9a", "#08303c"], ["#c8452f", "#3f0f0a"], ["#5a7d1e", "#1a2a08"],
  ["#3f51b5", "#111a45"], ["#b8860b", "#3a2804"],
];

/**
 * Square (or round) artwork. Uses the image when the catalog provides one,
 * otherwise a generated cover with the title set in block capitals.
 */
export function Cover({
  seed, label, src, round, className = "", textSize = "text-[15px]",
}: {
  seed: string; label?: string; src?: string | null; round?: boolean; className?: string; textSize?: string;
}) {
  const [a, b] = PALETTE[hashStr(seed) % PALETTE.length];
  const shape = round ? "rounded-full" : "rounded-2xl";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" loading="lazy" className={`aspect-square w-full object-cover ${shape} ${className}`} />;
  }
  const initials = (label ?? "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      aria-hidden="true"
      className={`relative aspect-square w-full overflow-hidden border border-white/10 ${shape} ${className}`}
      style={{ background: `linear-gradient(145deg, ${a}, ${b})` }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_0%,rgba(255,255,255,0.22),transparent_60%)]" />
      {round ? (
        <span className={`absolute inset-0 flex items-center justify-center font-semibold text-white/90 ${textSize}`}>{initials}</span>
      ) : (
        label && (
          <span className={`absolute inset-x-2.5 bottom-2 line-clamp-3 font-bold uppercase leading-[1.05] tracking-wide text-white/95 ${textSize}`}>
            {label}
          </span>
        )
      )}
    </div>
  );
}
