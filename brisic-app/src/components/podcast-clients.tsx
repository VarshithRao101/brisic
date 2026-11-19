"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Episode, Show } from "@/lib/catalog/types";
import { useToast } from "@/components/app-state";
import { Icon } from "@/components/icons";
import { fmtTime, hashStr } from "@/lib/format";

/** Warm accent used on every podcast screen in the design; the show colour sets the rest. */
const ACCENT = "#f7c886";
const EP_COLORS = ["#7a2a8a", "#d6841a", "#1c6be0", "#2f8a3a"];
export const epColor = (n: number) => EP_COLORS[(n - 1 + EP_COLORS.length * 10) % EP_COLORS.length];

const vars = (show: Show) => {
  const [a, b] = show.colors ?? ["#7a2a8a", "#2a0f45"];
  return { "--pod": a, "--pod2": b, "--acc": ACCENT } as CSSProperties;
};

function Headphones({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15v-3a8 8 0 0 1 16 0v3" /><rect x="3" y="14" width="5" height="7" rx="2" /><rect x="16" y="14" width="5" height="7" rx="2" />
    </svg>
  );
}

/** Saved on this device: which shows you subscribed to and get alerts for. */
function useLocalFlag(key: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setOn(localStorage.getItem(key) === "1"); } catch {}
  }, [key]);
  const set = (v: boolean) => { setOn(v); try { localStorage.setItem(key, v ? "1" : "0"); } catch {} };
  return [on, set] as const;
}

const TABS = ["Episodes", "About", "Community", "Reviews"] as const;

/** Show page from the design: coloured hero with mic, Subscribe / alerts / Support, tabs, episodes. */
export function ShowView({ show, episodes }: { show: Show; episodes: Episode[] }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Episodes");
  const [subscribed, setSubscribed] = useLocalFlag(`brisic-sub-${show.id}`);
  const [alerts, setAlerts] = useLocalFlag(`brisic-alert-${show.id}`);
  const latest = episodes[episodes.length - 1];
  const list = [...episodes].reverse();

  return (
    <div style={vars(show)} className="mx-auto max-w-2xl">
      <div className="relative -mx-4 -mt-3 h-[300px] overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-3xl" style={{ background: "linear-gradient(180deg, var(--pod) 0%, var(--pod2) 100%)" }}>
        <span aria-hidden="true" className="absolute -right-10 top-2 h-[230px] w-[230px] rounded-full bg-white/10" />
        <span aria-hidden="true" className="absolute -left-16 bottom-6 h-[160px] w-[160px] rounded-full bg-black/10" />
        <svg aria-hidden="true" viewBox="0 0 120 120" className="absolute right-6 top-8 h-[150px] w-[150px]" fill="none" stroke="var(--acc)" strokeWidth="2.6" strokeLinecap="round">
          <path d="M30 42a40 40 0 0 1 60 0M38 50a28 28 0 0 1 44 0M46 58a16 16 0 0 1 28 0" opacity="0.75" />
          <rect x="50" y="46" width="20" height="38" rx="10" fill="var(--acc)" stroke="none" />
          <path d="M42 74a18 18 0 0 0 36 0M60 92v14M48 106h24" />
        </svg>
        <button type="button" onClick={() => router.back()} aria-label="Back" className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-primary/70 bg-black/30 text-ink">
          <Icon name="back" size={18} />
        </button>
        <div className="absolute inset-x-4 bottom-0 bg-gradient-to-t from-black/70 to-transparent pb-4 pt-10 sm:inset-x-6">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--acc)]" style={{ background: "rgba(0,0,0,0.35)" }}>Video podcast</span>
          <h1 className="m-0 mt-2 text-[28px] font-bold leading-tight text-white">{show.title}</h1>
          <p className="m-0 text-[13px] font-light text-white/85">Hosted by {show.host} · New episode every Friday</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5">
        <button type="button" onClick={() => { setSubscribed(!subscribed); toast(subscribed ? "Unsubscribed" : `Subscribed to ${show.title}`); }} className="h-11 flex-1 rounded-full border-0 text-[15px] font-semibold text-[#2a1a05]" style={{ background: subscribed ? "transparent" : "var(--acc)", border: subscribed ? "1.5px solid var(--acc)" : undefined, color: subscribed ? "var(--acc)" : undefined }}>
          {subscribed ? "Subscribed" : "Subscribe"}
        </button>
        <button type="button" aria-pressed={alerts} aria-label={alerts ? "Turn off new episode alerts" : "Get new episode alerts"} onClick={() => { setAlerts(!alerts); toast(alerts ? "Alerts off" : "You'll hear about new episodes"); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--acc)] bg-transparent" style={{ color: "var(--acc)", background: alerts ? "rgba(247,200,134,0.15)" : undefined }}>
          <Icon name="bell" size={18} />
        </button>
        <Link href="/coins" className="flex h-11 flex-1 items-center justify-center rounded-full border-[1.5px] border-[var(--acc)] text-[15px] font-semibold text-[var(--acc)]">Support</Link>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1 rounded-full bg-white/[0.05] p-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className="h-9 rounded-full border-0 text-[13.5px] font-medium" style={{ background: tab === t ? "var(--acc)" : "transparent", color: tab === t ? "#2a1a05" : "#e9f2ec" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Episodes" && (
        <>
          {latest && (
            <>
              <Link href={`/listen/${latest.id}`} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-[var(--acc)] text-[15px] font-medium text-[var(--acc)]">
                <Headphones /> Listen (audio only)
              </Link>
              <div className="mt-4 rounded-2xl border border-[var(--acc)]/40 p-4" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--pod) 70%, #000), color-mix(in srgb, var(--pod2) 80%, #000))" }}>
                <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Latest episode</p>
                <p className="m-0 mt-1 text-[18px] font-semibold text-white">{show.title}, Ep. {latest.number}</p>
                <p className="m-0 text-[12.5px] font-light text-white/75">{latest.minutes} min · Video · Released this week</p>
                <Link href={`/watch/${latest.id}`} className="mt-3 flex h-11 items-center justify-center rounded-full text-[15px] font-semibold text-[#2a1a05]" style={{ background: "var(--acc)" }}>Watch now</Link>
              </div>
            </>
          )}
          <h2 className="m-0 mb-1 mt-5 text-[16px] font-semibold text-white">All episodes</h2>
          <ol className="m-0 list-none p-0">
            {list.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-b border-white/[0.06] py-2.5">
                <Link href={`/watch/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="h-11 w-16 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg, ${epColor(e.number)}, color-mix(in srgb, ${epColor(e.number)} 45%, #000))` }} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-white">Ep. {e.number} · {e.title}</span>
                    <span className="block text-[12.5px] font-light text-muted">{e.minutes} min · Video or audio</span>
                  </span>
                </Link>
                <Link href={`/listen/${e.id}`} aria-label={`Listen to episode ${e.number}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[var(--acc)] text-[var(--acc)]">
                  <Headphones size={17} />
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
      {tab === "About" && (
        <div className="panel mt-4 p-4">
          <p className="m-0 text-[15px] font-light leading-relaxed text-ink/90">{show.about}</p>
          <p className="m-0 mt-3 text-[13.5px] text-muted">Hosted by <span className="text-ink">{show.host}</span> · {show.episodeCount} episodes</p>
        </div>
      )}
      {tab === "Community" && (
        <div className="panel mt-4 p-4">
          <p className="m-0 text-[16px] font-semibold text-white">Listen with other fans</p>
          <p className="m-0 mt-1 text-[14px] font-light text-ink/80">Join a live party to talk about the latest episode with other listeners.</p>
          <Link href="/party" className="mt-3 flex h-11 items-center justify-center rounded-full text-[15px] font-semibold text-[#2a1a05]" style={{ background: "var(--acc)" }}>Join a party</Link>
        </div>
      )}
      {tab === "Reviews" && (
        <div className="panel mt-4 p-4 text-center">
          <p className="m-0 text-[15px] text-white">No reviews yet</p>
          <p className="m-0 mt-1 text-[13.5px] font-light text-muted">Reviews open once episodes stream from the media source.</p>
        </div>
      )}
    </div>
  );
}

const SPEEDS = [1, 1.25, 1.5, 2, 0.75];
const SLEEP = [0, 15, 30, 60];
/** Waveform bar heights, the same every time for an episode. */
const bars = (seed: string) => Array.from({ length: 48 }, (_, i) => 22 + ((hashStr(seed + i) % 70)));

/** Audio-only episode player from the design ("LISTENING"). Simulated until media is connected. */
export function ListenPlayer({ show, episode, episodes }: { show: Show; episode: Episode; episodes: Episode[] }) {
  const router = useRouter();
  const toast = useToast();
  const total = episode.minutes * 60;
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [sleep, setSleep] = useState(0);
  const wave = bars(episode.id);
  const chapters = [
    { at: 0, title: "Intro" },
    { at: Math.round(total * 0.18), title: "The story so far" },
    { at: Math.round(total * 0.42), title: "Studio nights" },
    { at: Math.round(total * 0.7), title: "Listener questions" },
  ];
  const idx = episodes.findIndex((e) => e.id === episode.id);
  const prevEp = idx > 0 ? episodes[idx - 1] : null;
  const nextEp = idx >= 0 && idx < episodes.length - 1 ? episodes[idx + 1] : null;

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => {
      const n = p + SPEEDS[speed];
      if (n >= total) { setPlaying(false); return total; }
      return n;
    }), 1000);
    return () => clearInterval(t);
  }, [playing, speed, total]);

  useEffect(() => {
    if (!playing || !SLEEP[sleep]) return;
    const t = setTimeout(() => { setPlaying(false); toast("Sleep timer: paused"); }, SLEEP[sleep] * 60_000);
    return () => clearTimeout(t);
  }, [playing, sleep, toast]);

  const seek = (s: number) => setPos(Math.max(0, Math.min(total, s)));
  const pct = pos / Math.max(1, total);
  const currentChapter = chapters.filter((c) => c.at <= pos).length - 1;

  return (
    <div style={vars(show)} className="min-h-dvh text-white" >
      <div aria-hidden="true" className="fixed inset-0 -z-10" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--pod) 55%, #0a0510) 0%, #0b0710 60%, #050307 100%)" }} />
      <div className="mx-auto w-full max-w-[460px] px-5 pb-16 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()} aria-label="Close" className="flex h-10 w-10 items-center justify-center border-0 bg-transparent text-white">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
          </button>
          <div className="text-center">
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Listening</p>
            <p className="m-0 text-[13px] text-white/85">{show.title}</p>
          </div>
          <Link href={`/watch/${episode.id}`} className="flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-[var(--acc)] px-3 text-[13px] text-[var(--acc)]">
            <Icon name="video" size={14} /> Video
          </Link>
        </div>

        <div className="relative mx-auto mt-5 aspect-[1/0.95] w-[82%] overflow-hidden rounded-[22px]" style={{ background: "linear-gradient(150deg, var(--pod), var(--pod2))" }}>
          <span aria-hidden="true" className="absolute -right-8 -top-8 h-[60%] w-[60%] rounded-full bg-white/10" />
          <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute left-1/2 top-[44%] h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2" fill="none" stroke="var(--acc)">
            {[44, 34, 24].map((r) => <circle key={r} cx="50" cy="50" r={r} strokeWidth="0.6" opacity="0.55" />)}
            {[20, 32, 44, 30, 40, 24, 16].map((h, i) => (
              <rect key={i} x={30 + i * 6.4} y={50 - h / 2} width="3.4" height={h} rx="1.7" fill="var(--acc)" stroke="none" style={playing ? { transformOrigin: `${31.7 + i * 6.4}px 50px`, animation: `brisicWave ${0.7 + (i % 3) * 0.2}s ease-in-out ${i * 0.08}s infinite` } : undefined} />
            ))}
          </svg>
          <div className="absolute bottom-4 left-4">
            <span className="inline-block rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--acc)]">Audio episode</span>
            <p className="m-0 mt-1 text-[18px] font-bold">{show.title}</p>
          </div>
        </div>

        <h1 className="m-0 mt-5 text-[21px] font-bold">Ep. {episode.number} · {episode.title}</h1>
        <p className="m-0 text-[13px] font-light text-white/65">{episode.minutes} min · Audio only</p>

        <div
          className="mt-4 flex h-14 cursor-pointer items-center gap-[2px]" role="slider" aria-label="Seek" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.round(pos)} tabIndex={0}
          onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * total); }}
          onKeyDown={(e) => { if (e.key === "ArrowRight") seek(pos + 15); if (e.key === "ArrowLeft") seek(pos - 15); }}
        >
          {wave.map((h, i) => (
            <span key={i} className="flex-1 rounded-full" style={{ height: `${h}%`, background: i / wave.length <= pct ? "var(--acc)" : "rgba(255,255,255,0.28)" }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[12px] tabular-nums text-white/60">
          <span>{fmtTime(pos)}</span><span>-{fmtTime(total - pos)}</span>
        </div>

        <div className="mt-4 flex items-center justify-between px-1">
          <button type="button" disabled={!prevEp} onClick={() => prevEp && router.replace(`/listen/${prevEp.id}`)} aria-label="Previous episode" className="border-0 bg-transparent p-2 text-white disabled:opacity-30"><Icon name="prev" size={24} /></button>
          <button type="button" onClick={() => seek(pos - 15)} aria-label="Back 15 seconds" className="relative flex h-11 w-11 items-center justify-center border-0 bg-transparent text-white">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 5v4h4" /></svg>
            <span className="absolute text-[9px] font-bold">15</span>
          </button>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="flex h-[70px] w-[70px] items-center justify-center rounded-full border-0 text-[#2a1a05]" style={{ background: "var(--acc)", boxShadow: "0 0 26px rgba(247,200,134,0.45)" }}>
            <Icon name={playing ? "pause" : "play"} size={30} />
          </button>
          <button type="button" onClick={() => seek(pos + 30)} aria-label="Forward 30 seconds" className="relative flex h-11 w-11 items-center justify-center border-0 bg-transparent text-white">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.5-5.8M20 5v4h-4" /></svg>
            <span className="absolute text-[9px] font-bold">30</span>
          </button>
          <button type="button" disabled={!nextEp} onClick={() => nextEp && router.replace(`/listen/${nextEp.id}`)} aria-label="Next episode" className="border-0 bg-transparent p-2 text-white disabled:opacity-30"><Icon name="next" size={24} /></button>
        </div>

        <div className="mt-4 flex justify-center gap-2">
          {[
            [`Speed ${SPEEDS[speed]}x`, () => setSpeed((s) => (s + 1) % SPEEDS.length)],
            [SLEEP[sleep] ? `Sleep ${SLEEP[sleep]}m` : "Sleep timer", () => setSleep((s) => (s + 1) % SLEEP.length)],
            ["Download", () => toast("Downloads are in the Brisic app")],
          ].map(([label, fn]) => (
            <button key={label as string} type="button" onClick={fn as () => void} className="h-8 rounded-full border-[1.5px] border-[var(--acc)] bg-transparent px-3.5 text-[13px] text-[var(--acc)]">{label as string}</button>
          ))}
        </div>
        {!episode.mediaUrl && <p className="m-0 mt-3 text-center text-[11.5px] font-light text-white/45">Preview: audio streams once the media source is connected.</p>}

        <h2 className="m-0 mb-2 mt-6 text-[16px] font-semibold">Chapters</h2>
        <div className="flex flex-col gap-2">
          {chapters.map((c, i) => (
            <button key={c.title} type="button" onClick={() => { seek(c.at); setPlaying(true); }} className="flex h-12 items-center gap-4 rounded-xl border-0 px-4 text-left text-[14.5px] text-white" style={{ background: i === currentChapter ? "rgba(247,200,134,0.14)" : "rgba(255,255,255,0.05)" }}>
              <span className="w-12 tabular-nums text-[var(--acc)]">{fmtTime(c.at)}</span>{c.title}
            </button>
          ))}
        </div>

        <h2 className="m-0 mb-1 mt-6 text-[16px] font-semibold">Up next</h2>
        <ol className="m-0 list-none p-0">
          {[...episodes].reverse().map((e) => (
            <li key={e.id}>
              <Link href={`/listen/${e.id}`} replace className="flex items-center gap-3 border-b border-white/[0.06] px-1 py-2.5" style={e.id === episode.id ? { background: "rgba(255,255,255,0.05)" } : undefined}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[var(--acc)]" style={{ background: `linear-gradient(135deg, ${epColor(e.number)}, color-mix(in srgb, ${epColor(e.number)} 45%, #000))` }}><Headphones /></span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-white">Ep. {e.number} · {e.title}</span>
                  <span className="block text-[12.5px] font-light text-white/55">{e.minutes} min · Audio</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Video podcast page from the design: player, quick chips, details and more episodes. */
export function WatchPlayer({ show, episode, more }: { show: Show; episode: Episode; more: Episode[] }) {
  const router = useRouter();
  const total = episode.minutes * 60;
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [captions, setCaptions] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPos((p) => {
      const n = p + SPEEDS[speed];
      if (n >= total) { setPlaying(false); return total; }
      return n;
    }), 1000);
    return () => clearInterval(t);
  }, [playing, speed, total]);
  const seek = (s: number) => setPos(Math.max(0, Math.min(total, s)));

  return (
    <div style={vars(show)} className="mx-auto min-h-dvh w-full max-w-[560px] px-4 pb-16 pt-[max(14px,env(safe-area-inset-top))]">
      <div aria-hidden="true" className="app-bg fixed inset-0 -z-10" />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.back()} aria-label="Back" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary bg-black/30 text-ink"><Icon name="back" size={18} /></button>
        <div className="min-w-0">
          <p className="m-0 truncate text-[18px] font-bold text-white">{show.title}</p>
          <p className="m-0 text-[12.5px] font-light text-muted">Video podcast</p>
        </div>
      </div>

      {episode.mediaUrl ? (
        <video src={episode.mediaUrl} controls playsInline className="mt-4 aspect-video w-full rounded-2xl bg-black" />
      ) : (
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-2xl border border-white/10" style={{ background: "linear-gradient(160deg, var(--pod), var(--pod2))" }}>
          <span aria-hidden="true" className="absolute left-[8%] top-[6%] h-[38%] w-[22%] rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -right-[4%] bottom-[8%] h-[46%] w-[26%] rounded-full bg-black/15" />
          <svg aria-hidden="true" viewBox="0 0 320 180" className="absolute inset-0 h-full w-full">
            {[[110, "#7a5238", "#2f7a34"], [210, "#9a6446", "#c0309a"]].map(([cx, skin, top]) => (
              <g key={cx as number}>
                <path d={`M${(cx as number) - 46} 180 C${(cx as number) - 46} 128 ${(cx as number) - 26} 116 ${cx} 116 C${(cx as number) + 26} 116 ${(cx as number) + 46} 128 ${(cx as number) + 46} 180 Z`} fill={top as string} />
                <circle cx={cx as number} cy="88" r="25" fill={skin as string} />
                <path d={`M${(cx as number) - 25} 84 C${(cx as number) - 24} 58 ${(cx as number) + 24} 58 ${(cx as number) + 25} 84 C${(cx as number) + 12} 74 ${(cx as number) - 12} 74 ${(cx as number) - 25} 84 Z`} fill="#140c08" />
              </g>
            ))}
          </svg>
          <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"} className="absolute left-1/2 top-[42%] flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/35 text-white">
            <Icon name={playing ? "pause" : "play"} size={24} className={playing ? "" : "ml-0.5"} />
          </button>
          {captions && <span className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded bg-black/70 px-2 py-0.5 text-[12px] text-white">{pos < 20 ? "Welcome back to the show." : "Preview: video streams once the media source is connected."}</span>}
          <div className="absolute inset-x-3 bottom-2 flex items-center gap-2 text-[11px] tabular-nums text-white">
            <span>{fmtTime(pos)}</span>
            <input type="range" min={0} max={total} value={pos} onChange={(e) => seek(Number(e.target.value))} aria-label="Seek" className="h-1 flex-1 cursor-pointer" style={{ accentColor: "var(--primary)" }} />
            <span>{fmtTime(total)}</span>
          </div>
        </div>
      )}

      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        <button type="button" className="chip shrink-0" onClick={() => setSpeed((s) => (s + 1) % SPEEDS.length)}>Speed {SPEEDS[speed]}x</button>
        <button type="button" className="chip shrink-0" aria-pressed={captions} onClick={() => setCaptions((c) => !c)}>Captions</button>
        <Link href={`/listen/${episode.id}`} className="chip shrink-0">Audio only</Link>
        <button type="button" className="chip shrink-0" onClick={() => seek(pos - 15)}>-15s</button>
        <button type="button" className="chip shrink-0" onClick={() => seek(pos + 15)}>+15s</button>
      </div>

      <h1 className="m-0 mt-4 text-[22px] font-bold text-white">{show.title}, Ep. {episode.number}</h1>
      <p className="m-0 text-[13px] font-light text-muted">Video podcast · {episode.minutes} min</p>
      <p className="m-0 mt-2 text-[14.5px] font-light leading-relaxed text-ink/90">{episode.description}</p>
      <div className="mt-4 flex gap-2.5">
        <Link href={`/shows/${show.id}`} className="btn btn-outline flex-1">View show</Link>
        <Link href="/coins" className="btn btn-primary flex-1">Support</Link>
      </div>

      {more.length > 0 && (
        <>
          <h2 className="m-0 mb-2 mt-6 text-[16px] font-semibold text-white">More episodes</h2>
          <div className="flex flex-col gap-2">
            {more.map((e) => (
              <Link key={e.id} href={`/watch/${e.id}`} replace className="flex items-center gap-3 rounded-2xl border border-line p-2.5 transition hover:border-primary/60" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)" }}>
                <span className="h-14 w-14 shrink-0 rounded-xl" style={{ background: `linear-gradient(135deg, ${epColor(e.number)}, color-mix(in srgb, ${epColor(e.number)} 45%, #000))` }} />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] text-white">{show.title}, Ep. {e.number}</span>
                  <span className="block text-[12.5px] font-light text-muted">{e.minutes} min · Video</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
