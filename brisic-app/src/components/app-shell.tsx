"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Cover } from "@/components/cover";
import { VoiceSheet } from "@/components/voice-sheet";
import { useLibrary, usePlayer } from "@/components/app-state";
import { useIsInstalledApp } from "@/lib/install";
import { fmtCoins, fmtTime } from "@/lib/format";

type ShellUser = { displayName: string; handle: string; image: string | null; isPremium: boolean };
type NavItem = { href: string; label: string; icon: IconName };

const MAIN: NavItem[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/library", label: "Library", icon: "books" },
  { href: "/ai", label: "Brisic AI", icon: "sparkle" },
];
const DISCOVER: NavItem[] = [
  { href: "/spotlight", label: "Artist Spotlight", icon: "video" },
  { href: "/party", label: "Community Party", icon: "users" },
  { href: "/trending", label: "Trending", icon: "trending" },
  { href: "/genres", label: "Genres", icon: "radio" },
  { href: "/stations", label: "Stations", icon: "radio" },
  { href: "/shows", label: "Podcasts", icon: "mic" },
];
const YOU: NavItem[] = [
  { href: "/library/liked", label: "Liked Songs", icon: "heart" },
  { href: "/coins", label: "B-Coins", icon: "coin" },
  { href: "/premium", label: "Premium", icon: "crown" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

// Title shown next to the logo on the main tabs, like the prototype's "LISTEN NOW" / "Library".
// Other pages carry their own heading, so the header shows the BRISIC wordmark instead.
const TITLES: Record<string, string> = { "/search": "Search", "/library": "Library", "/profile": "Profile" };
const titleFor = (path: string) => (path === "/" ? null : TITLES[path] ?? "");

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

function Avatar({ user, size = 40 }: { user: ShellUser; size?: number }) {
  return (
    <span className="ring-glow flex items-center justify-center rounded-full p-[1px]" style={{ width: size, height: size }}>
      {user.image ? (
        <Image src={user.image} alt="" width={size} height={size} unoptimized={user.image.startsWith("/api/")} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white" style={{ fontSize: size * 0.4, background: "linear-gradient(#c9803a,#5a2f14)" }}>
          {user.displayName[0]?.toUpperCase()}
        </span>
      )}
    </span>
  );
}

/** Mobile-web prompt to get the app, like Spotify's. Hidden inside the installed app and once dismissed. */
function AppBanner() {
  const installed = useIsInstalledApp();
  const [show, setShow] = useState(false);
  // Browser storage is only readable after hydration, so this has to run in an effect.
  useEffect(() => {
    try {
      const at = Number(localStorage.getItem("brisic-banner-dismissed") || 0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShow(Date.now() - at > 7 * 86_400_000);
    } catch {
      setShow(true);
    }
  }, []);
  if (installed || !show) return null;
  return (
    <div className="flex items-center gap-3 border-b border-line-soft bg-surface px-3 py-2.5 lg:hidden">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setShow(false);
          try { localStorage.setItem("brisic-banner-dismissed", String(Date.now())); } catch {}
        }}
        className="border-0 bg-transparent p-1 text-muted"
      >
        <Icon name="x" size={18} />
      </button>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-black">
        <Image src="/assets/logo-b-glow.png" alt="" width={333} height={640} className="logo-b h-8 w-auto" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="m-0 truncate text-[14px] font-semibold text-white">Brisic is better in the app</p>
        <p className="m-0 truncate text-[12px] font-light text-muted">Offline downloads and background play</p>
      </div>
      <Link href="/download" className="btn btn-primary btn-sm shrink-0">Get app</Link>
    </div>
  );
}

function NavList({ items, active }: { items: NavItem[]; active: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {items.map((it) => {
        const on = it.href === active;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${on ? "bg-primary/10 font-semibold text-white shadow-[inset_3px_0_0_var(--primary)]" : "text-muted hover:bg-white/5 hover:text-ink"}`}
            >
              <Icon name={it.icon} size={20} className={on ? "text-primary" : ""} />
              {it.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function PlayerBar() {
  const p = usePlayer();
  const lib = useLibrary();
  const t = p.current;
  if (!t) return null;
  const pct = Math.min(100, (p.position / Math.max(1, t.durationSec)) * 100);
  const likedNow = lib.liked.has(t.id);
  return (
    <div className="fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-30 lg:bottom-0">
      <div className="relative border-t border-line-soft bg-surface/95 backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-white/10 lg:hidden">
          <div className="h-full bg-player shadow-[0_0_8px_var(--player)]" style={{ width: pct + "%" }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-2 lg:grid lg:h-20 lg:grid-cols-[1fr_minmax(0,560px)_1fr] lg:px-5">
          <Link href="/player" className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg lg:h-14 lg:w-14">
              <Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" />
              {p.playing && (
                <span aria-hidden="true" className="absolute inset-0 flex items-end justify-center gap-[3px] bg-black/45 pb-2.5">
                  {[0, 0.2, 0.1].map((d) => (
                    <span key={d} className="h-4 w-[3px] origin-bottom rounded-sm bg-player" style={{ animation: `brisicWave 0.8s ease-in-out ${d}s infinite` }} />
                  ))}
                </span>
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14.5px] font-semibold text-white">{t.title}</span>
              <span className="block truncate text-[12.5px] font-light text-muted">{t.artistName}</span>
            </span>
          </Link>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex items-center gap-1 lg:gap-3">
              <button type="button" aria-label="Shuffle" aria-pressed={p.shuffle} onClick={p.toggleShuffle} className={`hidden border-0 bg-transparent p-2 lg:block ${p.shuffle ? "text-player" : "text-muted"}`}>
                <Icon name="shuffle" size={18} />
              </button>
              <button type="button" aria-label="Previous" onClick={p.prev} className="border-0 bg-transparent p-2 text-ink"><Icon name="prev" size={20} /></button>
              <button type="button" aria-label={p.playing ? "Pause" : "Play"} onClick={p.toggle} className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-white lg:bg-player lg:text-black">
                <Icon name={p.playing ? "pause" : "play"} size={22} />
              </button>
              <button type="button" aria-label="Next" onClick={p.next} className="border-0 bg-transparent p-2 text-ink"><Icon name="next" size={20} /></button>
              <Link href="/queue" aria-label="Queue" className="hidden p-2 text-muted hover:text-ink lg:block"><Icon name="queue" size={18} /></Link>
            </div>
            <div className="hidden w-full items-center gap-2 text-[11.5px] tabular-nums text-muted lg:flex">
              <span className="w-9 text-right">{fmtTime(p.position)}</span>
              <input
                type="range" aria-label="Seek" min={0} max={t.durationSec} value={Math.min(p.position, t.durationSec)}
                onChange={(e) => p.seek(Number(e.target.value))}
                className="h-1 flex-1 cursor-pointer" style={{ accentColor: "var(--player)" }}
              />
              <span className="w-9">{fmtTime(t.durationSec)}</span>
            </div>
          </div>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <button type="button" aria-label={likedNow ? "Remove from Liked Songs" : "Add to Liked Songs"} onClick={() => lib.toggleLike(t)} className={`border-0 bg-transparent p-2 ${likedNow ? "text-primary" : "text-muted"}`}>
              <Icon name="heart" size={20} fill={likedNow} />
            </button>
            <Link href="/player" className="btn btn-sm">Open player</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabLink({ href, label, icon, on }: { href: string; label: string; icon: IconName; on: boolean }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={`flex w-16 flex-col items-center gap-1 text-[12px] ${on ? "text-primary" : "text-[#b9c6bf]"}`}>
      <Icon name={on && icon === "home" ? "homeFill" : icon} size={27} />
      {label}
    </Link>
  );
}

export function AppShell({
  user, unread, playerColor, homeStyle, sample, children,
}: {
  user: ShellUser; unread: number; playerColor: string; homeStyle: string; sample: boolean; children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const lib = useLibrary();
  const installed = useIsInstalledApp();
  const [q, setQ] = useState("");
  const [voice, setVoice] = useState(false);
  // The most specific matching link wins, so /library/liked lights up Liked Songs, not Library too.
  const pickActive = (items: NavItem[]) => items.filter((i) => isActive(path, i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
  const active = pickActive([...MAIN, ...DISCOVER, ...YOU]);
  const title = titleFor(path);

  // Guitar-pick outline used by the "Shaped" home style (see .cover-round in globals.css).
  const pickDefs = (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <clipPath id="bpick" clipPathUnits="objectBoundingBox">
          <path d="M0.2,0.05 C0.36,0.0 0.64,0.0 0.8,0.05 C0.97,0.1 1.0,0.28 0.94,0.44 C0.85,0.67 0.65,0.9 0.55,0.97 C0.51,1.0 0.49,1.0 0.45,0.97 C0.35,0.9 0.15,0.67 0.06,0.44 C0.0,0.28 0.03,0.1 0.2,0.05 Z" />
        </clipPath>
      </defs>
    </svg>
  );

  // Players take the whole screen (music, podcast audio, podcast video): no header, tabs or mini player.
  if (path === "/player" || path.startsWith("/listen/") || path.startsWith("/watch/")) {
    return (
      <div data-player={playerColor} data-home={homeStyle} className="min-h-dvh text-ink">
        {pickDefs}
        {children}
      </div>
    );
  }

  return (
    <div data-player={playerColor} data-home={homeStyle} data-route={path === "/" ? "home" : "page"} className="min-h-dvh text-ink">
      <div aria-hidden="true" className="app-bg fixed inset-0 -z-10" />
      {pickDefs}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col gap-5 overflow-y-auto border-r border-line-soft bg-surface/80 px-3 pb-24 pt-5 backdrop-blur lg:flex">
        <Link href="/" className="flex items-center gap-3 px-3">
          <Image src="/assets/logo-b-glow.png" alt="" width={333} height={640} className="logo-b h-12 w-auto" />
          <span className="h-9 w-px bg-line" aria-hidden="true" />
          <span className="text-[20px] font-semibold uppercase tracking-[0.14em] text-white">Brisic</span>
        </Link>
        <button type="button" onClick={() => setVoice(true)} className="mx-3 flex items-center gap-3 rounded-full border-2 border-primary bg-transparent px-4 py-2.5 text-[14.5px] font-semibold text-accent" style={{ animation: "brisicPulse 3s ease-in-out infinite" }}>
          <Icon name="wave" size={20} /> Talk to Brisic AI
        </button>
        <nav aria-label="Main" className="flex flex-col gap-5">
          <NavList items={MAIN} active={active} />
          <div>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70">Discover</p>
            <NavList items={DISCOVER} active={active} />
          </div>
          <div>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/70">You</p>
            <NavList items={YOU} active={active} />
          </div>
        </nav>
        {!installed && (
          <Link href="/download" className="mt-auto flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-[14.5px] text-ink hover:bg-white/5">
            <Icon name="download" size={19} className="text-primary" />
            Install app
          </Link>
        )}
      </aside>

      <div className="lg:pl-64">
        <AppBanner />

        <header className="sticky top-0 z-10 flex h-[68px] items-center gap-2 bg-[color-mix(in_srgb,var(--bg)_86%,transparent)] px-4 backdrop-blur sm:px-6 lg:h-16 lg:border-b lg:border-line-soft lg:px-8">
          <Link href="/" aria-label="Brisic home" className="flex shrink-0 items-center lg:hidden">
            <Image src="/assets/logo-b-glow.png" alt="" width={333} height={640} priority className="logo-b h-[50px] w-auto" />
          </Link>
          <span aria-hidden="true" className="mx-1 h-10 w-px shrink-0 bg-line lg:hidden" />
          <p className={`m-0 min-w-0 flex-1 truncate text-white lg:hidden ${title ? "text-[clamp(19px,6vw,24px)] font-normal" : "whitespace-nowrap text-[clamp(16px,5.3vw,23px)] font-semibold uppercase tracking-[0.12em]"}`}>
            {title === null ? "Listen Now" : title || "Brisic"}
          </p>
          <form
            role="search"
            className="hidden max-w-md flex-1 lg:block"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) router.push("/search?q=" + encodeURIComponent(q.trim()));
            }}
          >
            <label className="relative block">
              <span className="sr-only">Search</span>
              <Icon name="search" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search artists, songs, albums…" className="field !h-10 !pl-11 !text-[14.5px]" />
            </label>
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2.5">
            {!user.isPremium && <Link href="/premium" className="btn btn-outline btn-sm hidden lg:inline-flex">Go Premium</Link>}
            <Link href="/coins" className="hidden h-9 items-center gap-1.5 rounded-full border border-line bg-white/5 px-3 text-[13.5px] font-semibold text-[#f2c94c] sm:flex" aria-label={`${lib.coins} B-Coins`}>
              <Image src="/assets/coin.png" alt="" width={18} height={18} className="h-[18px] w-[18px]" />
              {fmtCoins(lib.coins)}
            </Link>
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} className="relative flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-white/5">
              <Icon name="bell" size={26} />
              {unread > 0 && <span className="absolute right-2 top-2 h-[9px] w-[9px] rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />}
            </Link>
            <Link href="/profile" aria-label="Profile" className="flex h-11 w-11 items-center justify-center"><Avatar user={user} /></Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-48 pt-3 sm:px-6 lg:px-8 lg:pb-32 lg:pt-6">
          {children}
          {sample && (
            <p className="mt-10 text-center text-[12px] font-light text-muted/70">
              Some shelves show sample music while Brisic artists upload their catalog.
            </p>
          )}
        </main>
      </div>

      <PlayerBar />

      {/* Mobile bottom navigation: four tabs around the Brisic AI button */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex h-[76px] max-w-xl items-center justify-between px-4 sm:px-8">
          <TabLink href="/" label="Home" icon="home" on={isActive(path, "/")} />
          <TabLink href="/search" label="Search" icon="search" on={isActive(path, "/search") || isActive(path, "/genres")} />
          <button
            type="button"
            onClick={() => setVoice(true)}
            aria-label="Talk to Brisic AI"
            className="-mt-1 flex h-[58px] w-[58px] items-center justify-center rounded-full border-2 border-primary bg-transparent text-accent"
            style={{ animation: "brisicPulse 3s ease-in-out infinite" }}
          >
            <Icon name="wave" size={30} />
          </button>
          <TabLink href="/library" label="Library" icon="books" on={isActive(path, "/library") || isActive(path, "/following")} />
          <TabLink href="/profile" label="Profile" icon="user" on={isActive(path, "/profile") || isActive(path, "/settings")} />
        </div>
      </nav>

      <VoiceSheet open={voice} onClose={() => setVoice(false)} />
    </div>
  );
}
