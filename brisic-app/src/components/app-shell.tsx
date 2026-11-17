"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";
import { Cover } from "@/components/cover";
import { useLibrary, usePlayer } from "@/components/app-state";
import { useIsInstalledApp } from "@/lib/install";
import { fmtCoins, fmtTime } from "@/lib/format";

type ShellUser = { displayName: string; handle: string; image: string | null; isPremium: boolean };

const MAIN: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/ai", label: "Brisic AI", icon: "sparkle" },
];
const DISCOVER: { href: string; label: string; icon: IconName }[] = [
  { href: "/trending", label: "Trending", icon: "trending" },
  { href: "/genres", label: "Genres", icon: "radio" },
  { href: "/stations", label: "Stations", icon: "radio" },
  { href: "/shows", label: "Podcasts", icon: "mic" },
  { href: "/party", label: "Community Party", icon: "users" },
];
const YOU: { href: string; label: string; icon: IconName }[] = [
  { href: "/library/liked", label: "Liked Songs", icon: "heart" },
  { href: "/premium", label: "Premium", icon: "crown" },
  { href: "/settings", label: "Settings", icon: "settings" },
];
const MOBILE: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/search", label: "Search", icon: "search" },
  { href: "/ai", label: "AI", icon: "sparkle" },
  { href: "/library", label: "Library", icon: "library" },
  { href: "/profile", label: "Profile", icon: "user" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

function Avatar({ user, size = 36 }: { user: ShellUser; size?: number }) {
  return user.image ? (
    <Image src={user.image} alt="" width={size} height={size} unoptimized={user.image.startsWith("/api/")} className="rounded-full border border-line object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex items-center justify-center rounded-full bg-primary font-semibold text-primary-ink" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user.displayName[0]?.toUpperCase()}
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
    <div className="flex items-center gap-3 border-b border-line bg-[#0b1a11] px-3 py-2.5 lg:hidden">
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
      <Image src="/assets/logo-b-plain.png" alt="" width={333} height={640} className="h-9 w-auto" />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-[14px] font-semibold text-white">Brisic is better in the app</p>
        <p className="truncate text-[12px] font-light text-muted">Offline downloads and background play</p>
      </div>
      <Link href="/download" className="btn btn-primary btn-sm shrink-0">Get app</Link>
    </div>
  );
}

function NavList({ items, active }: { items: typeof MAIN; active: string }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {items.map((it) => {
        const on = it.href === active;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition ${on ? "bg-white/10 font-semibold text-white" : "text-muted hover:bg-white/5 hover:text-ink"}`}
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
    <div className="fixed inset-x-0 bottom-16 z-30 px-2 lg:bottom-0 lg:px-0">
      <div className="relative overflow-hidden rounded-2xl border border-line bg-[#0d1f15]/95 backdrop-blur lg:rounded-none lg:border-x-0 lg:border-b-0">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-white/10 lg:hidden">
          <div className="h-full bg-player" style={{ width: pct + "%" }} />
        </div>
        <div className="flex items-center gap-3 px-3 py-2 lg:grid lg:h-20 lg:grid-cols-[1fr_minmax(0,560px)_1fr] lg:px-5">
          <Link href="/player" className="flex min-w-0 flex-1 items-center gap-3">
            <div className="w-11 shrink-0 lg:w-14"><Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" /></div>
            <div className="min-w-0">
              <p className="truncate text-[14.5px] font-semibold text-white">{t.title}</p>
              <p className="truncate text-[12.5px] font-light text-muted">{t.artistName}</p>
            </div>
          </Link>

          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex items-center gap-1 lg:gap-3">
              <button type="button" aria-label={likedNow ? "Remove from Liked Songs" : "Add to Liked Songs"} onClick={() => lib.toggleLike(t)} className={`border-0 bg-transparent p-2 lg:hidden ${likedNow ? "text-primary" : "text-muted"}`}>
                <Icon name="heart" size={20} fill={likedNow} />
              </button>
              <button type="button" aria-label="Shuffle" aria-pressed={p.shuffle} onClick={p.toggleShuffle} className={`hidden border-0 bg-transparent p-2 lg:block ${p.shuffle ? "text-player" : "text-muted"}`}>
                <Icon name="shuffle" size={18} />
              </button>
              <button type="button" aria-label="Previous" onClick={p.prev} className="hidden border-0 bg-transparent p-2 text-ink lg:block"><Icon name="prev" size={20} /></button>
              <button type="button" aria-label={p.playing ? "Pause" : "Play"} onClick={p.toggle} className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-player text-black">
                <Icon name={p.playing ? "pause" : "play"} size={20} />
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

export function AppShell({
  user, unread, playerColor, sample, children,
}: {
  user: ShellUser; unread: number; playerColor: string; sample: boolean; children: ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const lib = useLibrary();
  const installed = useIsInstalledApp();
  const [q, setQ] = useState("");
  // The most specific matching link wins, so /library/liked lights up Liked Songs, not Library too.
  const pickActive = (items: typeof MAIN) => items.filter((i) => isActive(path, i.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href ?? "";
  const active = pickActive([...MAIN, ...DISCOVER, ...YOU]);
  const mobileActive = pickActive(MOBILE);

  return (
    <div style={{ "--player": playerColor } as CSSProperties} className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col gap-5 overflow-y-auto border-r border-line bg-[#040806]/80 px-3 pb-24 pt-5 backdrop-blur lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-3">
          <Image src="/assets/logo-b-plain.png" alt="" width={333} height={640} className="h-9 w-auto" />
          <span className="text-[22px] font-semibold tracking-tight text-white">Brisic</span>
        </Link>
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

        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/5 bg-[#050a07]/85 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <Image src="/assets/logo-b-plain.png" alt="" width={333} height={640} className="h-8 w-auto" />
            <span className="text-[19px] font-semibold text-white">Brisic</span>
          </Link>
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Songs, artists, podcasts" className="field !h-10 !pl-11 !text-[14.5px]" />
            </label>
          </form>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
            {!user.isPremium && <Link href="/premium" className="btn btn-sm hidden sm:inline-flex">Go Premium</Link>}
            <Link href="/coins" className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-white/5 px-3 text-[13.5px] font-semibold text-[#f2c94c]" aria-label={`${lib.coins} B-Coins`}>
              <Icon name="coin" size={16} />
              {fmtCoins(lib.coins)}
            </Link>
            <Link href="/notifications" aria-label={unread ? `Notifications, ${unread} new` : "Notifications"} className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-white/5">
              <Icon name="bell" size={20} />
              {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#050a07] bg-primary" />}
            </Link>
            <Link href="/profile" aria-label="Profile"><Avatar user={user} /></Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pb-44 pt-5 sm:px-6 lg:px-8 lg:pb-32">
          {children}
          {sample && (
            <p className="mt-10 text-center text-[12px] font-light text-muted/70">
              Showing the sample catalog. Live music and audio appear once the Global Tune API is connected.
            </p>
          )}
        </main>
      </div>

      <PlayerBar />

      {/* Mobile bottom navigation */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#050a07]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-around px-1">
          {MOBILE.map((it) => {
            const on = it.href === mobileActive;
            return (
              <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={`flex w-16 flex-col items-center gap-1 py-1 text-[11px] ${on ? "text-primary" : "text-muted"}`}>
                <Icon name={it.icon} size={22} />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
