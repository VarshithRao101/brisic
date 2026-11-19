"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { TrackDetails } from "@/lib/catalog/types";
import { fetchTrackDetails } from "@/app/actions";
import { ArtistFace } from "@/components/cover";
import { Icon } from "@/components/icons";
import { useLibrary, usePlayer } from "@/components/app-state";
import { fmtCount, fmtTime } from "@/lib/format";

type ArtistInfo = { name: string; genre: string; bio: string; monthlyListeners: number } | null;

/** "Brisic Originals" artwork from the design: an illustrated artist wearing headphones. */
function OriginalsArt() {
  return (
    <svg viewBox="0 0 330 326" className="h-full w-full" role="img" aria-label="Illustrated artist wearing headphones and sunglasses">
      <defs>
        <linearGradient id="cvBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="color-mix(in srgb, var(--primary) 32%, #2c3d37)" />
          <stop offset="1" stopColor="#0d1814" />
        </linearGradient>
        <radialGradient id="cvGlow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.38" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cvSkin" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#85604a" />
          <stop offset="1" stopColor="#4a3022" />
        </linearGradient>
        <linearGradient id="cvFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="330" height="326" fill="url(#cvBg)" />
      <rect width="330" height="326" fill="url(#cvGlow)" />
      <path d="M36 326 C36 238 92 206 165 206 C238 206 294 238 294 326 Z" fill="#0a100e" stroke="color-mix(in srgb, var(--primary) 45%, #1d2a25)" strokeWidth="2" />
      <rect x="145" y="164" width="40" height="56" rx="16" fill="#4a3022" />
      <path d="M124 216 Q165 268 206 216" fill="none" stroke="#d3dcd8" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="165" cy="249" r="5.5" fill="#d3dcd8" />
      <ellipse cx="165" cy="120" rx="45" ry="55" fill="url(#cvSkin)" />
      <path d="M118 112 C116 66 140 50 165 50 C190 50 214 66 212 112 C202 90 188 82 165 82 C142 82 128 90 118 112 Z" fill="#090909" />
      {[[130, 80], [146, 62], [165, 55], [184, 62], [200, 80]].map(([cx, cy]) => <circle key={cx} cx={cx} cy={cy} r="11" fill="#090909" />)}
      <rect x="134" y="108" width="29" height="18" rx="8" fill="#050807" />
      <rect x="167" y="108" width="29" height="18" rx="8" fill="#050807" />
      <path d="M163 114h4" stroke="#050807" strokeWidth="3" />
      <path d="M139 112 L150 112 M172 112 L183 112" stroke="var(--primary)" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
      <path d="M153 156 Q165 162 177 156" fill="none" stroke="#2c1b13" strokeWidth="3" strokeLinecap="round" />
      <path d="M112 124 C106 36 224 36 218 124" fill="none" stroke="#141a17" strokeWidth="10" strokeLinecap="round" />
      <path d="M112 124 C106 36 224 36 218 124" fill="none" stroke="#3f4d47" strokeWidth="2" strokeLinecap="round" transform="translate(0 -3)" />
      <rect x="98" y="104" width="24" height="56" rx="12" fill="#121715" stroke="var(--primary)" strokeWidth="1.6" />
      <rect x="208" y="104" width="24" height="56" rx="12" fill="#121715" stroke="var(--primary)" strokeWidth="1.6" />
      <rect y="206" width="330" height="120" fill="url(#cvFade)" />
      <text x="16" y="28" fontFamily="var(--font-outfit), system-ui, sans-serif" fontSize="10" fontWeight="500" letterSpacing="2.4" fill="#cfe8da" fillOpacity="0.85">BRISIC ORIGINALS</text>
    </svg>
  );
}

const circleBtn = "flex h-[42px] w-[42px] items-center justify-center rounded-full border-[1.5px] border-primary bg-[rgba(8,20,12,0.7)] text-accent";
const card = "rounded-[18px] border border-line p-[18px]";
const cardBg = { background: "color-mix(in srgb, var(--card) 80%, transparent)" };

/** Full-screen Now Playing, copied from the Brisic prototype design. Opened from the mini player. */
export function NowPlaying() {
  const router = useRouter();
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.current;
  const [loaded, setLoaded] = useState<{ id: string; details: TrackDetails | null; artist: ArtistInfo } | null>(null);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  // The B starts visible every time the player opens, then fades while music plays.
  const [fadeB, setFadeB] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFadeB(p.playing), p.playing ? 120 : 0);
    return () => clearTimeout(t);
  }, [p.playing]);
  const trackId = t?.id;
  const artistId = t?.artistId;
  // Only show details that belong to the current song.
  const info = loaded && loaded.id === trackId ? loaded : null;

  useEffect(() => {
    if (!trackId) return;
    let live = true;
    fetchTrackDetails(trackId, artistId || undefined)
      .then((r) => { if (live) setLoaded({ id: trackId, details: r.details, artist: r.artist }); })
      .catch(() => {});
    return () => { live = false; };
  }, [trackId, artistId]);

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const bg = { background: "radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--primary) 30%, #0b1d14) 0%, color-mix(in srgb, var(--primary) 12%, #08110c) 45%, #050907 100%)" };

  if (!t) {
    return (
      <div className="player-tint flex min-h-dvh flex-col items-center justify-center gap-3 px-8 text-center" style={bg}>
        <p className="m-0 text-[20px] font-medium text-white">Nothing is playing</p>
        <p className="m-0 text-[15px] text-muted">Pick a song, playlist or station and it will show up here.</p>
        <Link href="/" className="btn btn-outline mt-2">Back to Home</Link>
      </div>
    );
  }

  const likedNow = lib.liked.has(t.id);
  const lyrics = info?.details?.lyrics ?? [];
  const credits = info?.details?.credits ?? [];
  const artist = info?.artist;
  const following = lib.followed.has(t.artistId);
  const pct = Math.min(100, (p.position / Math.max(1, t.durationSec)) * 100);
  const currentLine = lyrics.length ? Math.min(lyrics.length - 1, Math.floor((p.position / Math.max(1, t.durationSec)) * lyrics.length)) : -1;
  const toggleBase = "flex h-[46px] w-[46px] items-center justify-center border-0 bg-transparent";

  return (
    <div className="relative min-h-dvh text-[#e8fff0]">
      {/* "player-tint" layers take the Music player color from Settings (a hue shift, as in the prototype). */}
      <div aria-hidden="true" className="player-tint fixed inset-0 -z-10" style={bg} />
      {/* Top controls stay put while the page scrolls */}
      <div aria-hidden="true" className="player-tint pointer-events-none fixed inset-x-0 top-0 z-10 h-[76px]" style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 26%, #0b1d14) 0%, color-mix(in srgb, var(--primary) 18%, rgba(11,29,20,0.85)) 55%, transparent 100%)" }} />
      <div className="player-tint pointer-events-none fixed inset-x-0 top-0 z-20 mx-auto flex max-w-[480px] justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]">
        <button type="button" onClick={close} aria-label="Close player" className={`pointer-events-auto ${circleBtn}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 9l7 7 7-7" /></svg>
        </button>
        <Link href="/queue" aria-label="Up next" className={`pointer-events-auto ${circleBtn}`}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h12M4 12h12M4 17h8M19 8v9" /></svg>
        </Link>
      </div>

      <div className="player-tint mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center px-[clamp(20px,11vw,50px)] pt-[max(20px,env(safe-area-inset-top))]">
        {/* While music plays the B shrinks and fades away together over 15 seconds; it returns when paused. */}
        <Image
          src="/assets/logo-b-glow.png" alt="Brisic" width={333} height={640} priority
          className="logo-b h-[clamp(110px,18dvh,164px)] w-auto shrink-0 object-contain will-change-[opacity,transform]"
          style={{
            opacity: fadeB ? 0 : 1,
            transform: fadeB ? "scale(0.55)" : "scale(1)",
            transition: fadeB ? "opacity 15s linear, transform 15s linear" : "opacity 0.6s ease, transform 0.6s ease",
          }}
        />

        <div className="mt-6 aspect-[330/326] w-full shrink-0 overflow-hidden rounded-[20px] shadow-[0_18px_44px_rgba(0,0,0,0.5)]">
          {t.artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.artwork} alt="" className="h-full w-full object-cover" />
          ) : (
            <OriginalsArt />
          )}
        </div>

        <div className="mt-6 flex w-full items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-px">
            <h1 className="m-0 truncate text-[27px] font-medium leading-[1.15] text-primary">{t.title}</h1>
            <Link href={`/artist/${t.artistId}`} className="truncate text-[19px] font-light leading-[1.2] text-[color-mix(in_srgb,var(--primary)_22%,#b6c4bc)]">{t.artistName}</Link>
            {t.streams > 0 && (
              <span className="mt-1 flex items-center gap-1.5 text-[14px] font-light text-accent">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
                {t.streams.toLocaleString("en-US")} streams
              </span>
            )}
          </div>
          <button
            type="button" onClick={() => lib.toggleLike(t)} aria-pressed={likedNow} aria-label={likedNow ? "Remove from Liked Songs" : "Add to Liked Songs"}
            className="-mr-3 flex h-12 w-12 shrink-0 items-center justify-center border-0 bg-transparent"
          >
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" style={likedNow ? { filter: "drop-shadow(0 0 6px var(--primary))" } : undefined}>
              <path d="M12 21 C6 16.5 3 13.2 3 9.5 C3 6.8 5 5 7.4 5 C9.2 5 10.9 6 12 7.7 C13.1 6 14.8 5 16.6 5 C19 5 21 6.8 21 9.5 C21 13.2 18 16.5 12 21 Z" fill={likedNow ? "var(--primary)" : "none"} stroke="var(--primary)" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="mt-3 w-full">
          <input
            type="range" min={0} max={t.durationSec} value={Math.min(p.position, t.durationSec)} aria-label="Seek"
            onChange={(e) => p.seek(Number(e.target.value))}
            className="block h-6 w-full cursor-pointer" style={{ accentColor: "var(--primary)" }}
          />
          <div className="mt-0.5 flex justify-between text-[13px] font-light tabular-nums text-[#9fb4a6]">
            <span>{fmtTime(p.position)}</span>
            <span>-{fmtTime(Math.max(0, t.durationSec - p.position))}</span>
          </div>
        </div>

        <div className="mt-[22px] flex h-[70px] w-full max-w-[354px] items-center justify-between">
          <button type="button" onClick={p.toggleShuffle} aria-label="Shuffle" aria-pressed={p.shuffle} className={`${toggleBase} ${p.shuffle ? "text-white" : "text-[#8a9a92]"}`}>
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h3c4 0 5 10 9 10h6M3 17h3c1.6 0 2.7-1.6 3.7-3.4M21 7h-6c-1.3 0-2.3.7-3.1 1.8M18 4l3 3-3 3M18 14l3 3-3 3" /></svg>
          </button>
          <button type="button" onClick={p.prev} aria-label="Previous track" className="flex h-[54px] w-[54px] items-center justify-center border-0 bg-transparent text-white">
            <svg viewBox="0 0 24 24" width="27" height="27" fill="currentColor" aria-hidden="true"><path d="M6 5h2.5v14H6zM20 5v14L9.5 12z" /></svg>
          </button>
          <button
            type="button" onClick={p.toggle} aria-label={p.playing ? "Pause" : "Play"}
            className="flex h-[67px] w-[67px] items-center justify-center rounded-full border-2 border-white text-white"
            style={{ background: "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.28), rgba(255,255,255,0.06))", boxShadow: "0 0 22px rgba(255,255,255,0.35), inset 0 0 14px rgba(255,255,255,0.15)" }}
          >
            {p.playing ? (
              <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="31" height="31" fill="currentColor" aria-hidden="true" style={{ marginLeft: 3 }}><path d="M7 4.5v15L19.5 12z" /></svg>
            )}
          </button>
          <button type="button" onClick={p.next} aria-label="Next track" className="flex h-[54px] w-[54px] items-center justify-center border-0 bg-transparent text-white">
            <svg viewBox="0 0 24 24" width="27" height="27" fill="currentColor" aria-hidden="true"><path d="M15.5 5H18v14h-2.5zM4 5v14l10.5-7z" /></svg>
          </button>
          <button
            type="button" onClick={p.cycleRepeat} aria-label={p.repeat === "one" ? "Repeat this song" : p.repeat === "all" ? "Repeat all" : "Repeat off"} aria-pressed={p.repeat !== "off"}
            className={`relative ${toggleBase} ${p.repeat !== "off" ? "text-white" : "text-[#8a9a92]"}`}
          >
            <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3" /></svg>
            {p.repeat === "one" && <span className="absolute right-1.5 top-1.5 text-[10px] font-bold">1</span>}
          </button>
        </div>

        {!p.hasAudio && (
          <p className="m-0 mt-1 text-center text-[12px] font-light text-white/55">Preview: audio plays once the Global Tune catalog is connected.</p>
        )}

        <div className="mb-1 mt-auto flex w-full items-center gap-2.5 pt-5 text-white">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /></svg>
          <input type="range" min={0} max={100} value={Math.round(p.volume * 100)} onChange={(e) => p.setVolume(Number(e.target.value) / 100)} aria-label="Volume" className="h-6 flex-1 cursor-pointer" style={{ accentColor: "#ffffff" }} />
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
        </div>
        <button
          type="button" onClick={() => setLyricsOpen(true)} aria-label="Show lyrics"
          className="mb-5 mt-1 flex h-10 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-primary bg-white/5 px-[22px] text-[16px] font-medium text-white"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 7h14M5 12h10M5 17h12" /></svg>
          Lyrics
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
        </button>
      </div>

      {/* Scroll for more: about the song, credits, about the artist */}
      <div className="player-tint mx-auto w-full max-w-[430px] px-[18px] pb-28 pt-1.5">
        <div className="-mt-2 mb-4 flex items-center justify-center gap-1.5 text-[13px] text-muted">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          Scroll for more
        </div>

        {info?.details?.about && (
          <section className={`${card} mb-4`} style={cardBg}>
            <h2 className="m-0 mb-2.5 text-[18px] font-semibold text-white">About the song</h2>
            <p className="m-0 mb-1.5 text-[12.5px] uppercase tracking-[0.12em] text-primary">What inspired it</p>
            <p className="m-0 text-[15.5px] font-light leading-[1.55] text-[#cfe0d5]">{info.details.about}</p>
          </section>
        )}

        <section className={`${card} mb-4`} style={cardBg}>
          <h2 className="m-0 mb-2.5 text-[18px] font-semibold text-white">Credits</h2>
          {(credits.length ? credits : [{ label: "Performed by", value: t.artistName }]).map((c) => (
            <div key={c.label} className="flex justify-between gap-3 border-t border-white/[0.07] py-[9px] text-[14.5px]">
              <span className="font-light text-muted">{c.label}</span>
              <span className="text-right text-[#eef5f0]">{c.value}</span>
            </div>
          ))}
          {t.streams > 0 && (
            <div className="flex justify-between gap-3 border-t border-white/[0.07] py-[9px] text-[14.5px]">
              <span className="font-light text-muted">Streams</span>
              <span className="text-right text-[#eef5f0]">{fmtCount(t.streams)}</span>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[20px] border border-line" style={cardBg}>
          <div className="relative h-[110px]" style={{ background: "radial-gradient(circle at 70% 30%, color-mix(in srgb, var(--primary) 65%, #1a3a20) 0%, color-mix(in srgb, var(--primary) 22%, #08140c) 55%, #07120a 100%)" }}>
            <span className="absolute left-4 top-3.5 text-[13px] uppercase tracking-[0.12em] text-[#cfeed6]">About the artist</span>
          </div>
          <div className="-mt-[38px] px-[18px] pb-[18px]">
            <div className="flex items-end gap-3.5">
              <Link href={`/artist/${t.artistId}`} aria-label="Artist profile" className="block h-[88px] w-[88px] shrink-0 rounded-full border-[3px] border-primary bg-[#07120a] p-[3px] shadow-[0_0_16px_rgba(var(--primary-rgb),0.35)]">
                <ArtistFace seed={t.artistId} className="h-full w-full rounded-full" />
              </Link>
              <button
                type="button" onClick={() => lib.toggleFollow(t.artistId, t.artistName)} aria-pressed={following}
                className={`mb-1 h-10 min-w-24 rounded-full border-[1.5px] border-primary px-5 text-[15px] font-semibold ${following ? "bg-primary text-primary-ink" : "bg-transparent text-white"}`}
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
            <Link href={`/artist/${t.artistId}`} className="mt-3 block text-white">
              <span className="block text-[22px] font-semibold">{t.artistName}</span>
              {artist && <span className="mt-0.5 block text-[14px] font-light text-accent">{fmtCount(artist.monthlyListeners)} monthly listeners</span>}
            </Link>
            {artist?.bio && <p className="m-0 mt-2.5 text-[14.5px] font-light leading-[1.55] text-[#bcd0c3]">{artist.bio}</p>}
            <div className="mt-3.5 flex gap-2.5">
              <Link href={`/artist/${t.artistId}`} className="flex h-[42px] flex-1 items-center justify-center rounded-full border-[1.5px] border-primary text-[15px] text-accent">View profile</Link>
              <Link href={`/artist/${t.artistId}/support`} className="flex h-[42px] flex-1 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-primary-ink">Support</Link>
            </div>
          </div>
        </section>
      </div>

      {lyricsOpen && (
        <div className="player-tint fixed inset-0 z-30" onClick={() => setLyricsOpen(false)}>
          <div
            role="dialog" aria-modal="true" aria-label="Lyrics" onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 top-24 mx-auto flex max-w-[480px] flex-col rounded-t-[34px] border-t-[1.5px] border-primary shadow-[0_-12px_40px_rgba(var(--primary-rgb),0.22)]"
            style={{ background: "linear-gradient(180deg, color-mix(in srgb, var(--primary) 16%, #08140c) 0%, #070d09 55%, #040605 100%)" }}
          >
            <div className="flex items-center px-[26px] pb-2 pt-5">
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[21px] font-semibold text-white">{t.title}</p>
                <p className="m-0 text-[14px] font-light text-[#a9c2b3]">{t.artistName} · Lyrics</p>
              </div>
              <button type="button" onClick={() => setLyricsOpen(false)} aria-label="Close lyrics" className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-0 bg-white/10 p-0 text-white">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </div>
            <div className="no-scrollbar flex-1 overflow-y-auto px-7 pb-6 pt-2">
              {lyrics.length === 0 ? (
                <p className="m-0 pt-6 text-center text-[16px] font-light text-muted">Lyrics for this song arrive with the Global Tune catalog.</p>
              ) : (
                lyrics.map((l, i) => (
                  <button
                    key={i} type="button" onClick={() => p.seek(Math.floor((i / lyrics.length) * t.durationSec))}
                    className={`block w-full border-0 bg-transparent px-0 py-1.5 text-left text-[22px] font-semibold leading-snug transition ${i === currentLine ? "text-white" : i < currentLine ? "text-white/35" : "text-white/55"}`}
                  >
                    {l.section && <span className="mb-1 block text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">{l.section}</span>}
                    {l.text}
                  </button>
                ))
              )}
            </div>
            <div className="flex items-center gap-3.5 border-t border-white/[0.08] px-[26px] pb-10 pt-2.5">
              <button type="button" onClick={p.toggle} aria-label={p.playing ? "Pause" : "Play"} className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary bg-transparent p-0 text-white">
                <Icon name={p.playing ? "pause" : "play"} size={20} />
              </button>
              <input type="range" min={0} max={t.durationSec} value={Math.min(p.position, t.durationSec)} onChange={(e) => p.seek(Number(e.target.value))} aria-label="Seek" className="h-6 flex-1 cursor-pointer" style={{ accentColor: "var(--primary)" }} />
              <span className="w-10 text-right text-[12px] tabular-nums text-muted">{Math.round(pct)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

