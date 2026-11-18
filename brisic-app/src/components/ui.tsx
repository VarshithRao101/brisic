import Link from "next/link";
import type { ReactNode } from "react";
import type { Album, Artist, Playlist, Show } from "@/lib/catalog/types";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { fmtCount, hashStr } from "@/lib/format";

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-[26px] font-semibold leading-tight text-white sm:text-[30px]">{title}</h1>
        {subtitle && <p className="m-0 mt-1 text-[14.5px] font-light text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Poster-style page heading ("ARTIST SPOTLIGHT"). */
export function DisplayTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`display m-0 text-[34px] text-primary sm:text-[42px] ${className}`}>{children}</h1>;
}

/** Section heading like the prototype: "Trending Artist >" with an optional "See all" on the right. */
export function Section({ title, href, more, children }: { title: string; href?: string; more?: string; children: ReactNode }) {
  return (
    <section className="mt-7 first:mt-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        {href ? (
          <Link href={href} className="group flex items-center gap-2 text-[20px] font-normal text-[#f1f7f3]">
            <h2 className="m-0 text-[20px] font-normal">{title}</h2>
            <Icon name="chevron" size={18} className="text-primary transition group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <h2 className="m-0 text-[20px] font-normal text-[#f1f7f3]">{title}</h2>
        )}
        {href && <Link href={href} className="shrink-0 text-[13px] font-medium text-primary hover:underline">{more ?? "See all"}</Link>}
      </div>
      {children}
    </section>
  );
}

/** Horizontal scroller on phones, wrapping grid on wide screens. */
export function Shelf({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className={`no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:gap-5 lg:overflow-visible lg:px-0 ${wide ? "lg:grid-cols-4" : "lg:grid-cols-5 xl:grid-cols-6"}`}>
      {children}
    </div>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6">{children}</div>;
}

const tile = "block w-[156px] shrink-0 sm:w-[176px] lg:w-auto";

/** Round play mark in the corner of a cover. Decorative: the whole card is the link. */
export function PlayRing({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`play-ring absolute bottom-2 right-2 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-primary bg-black/55 text-[#e9f2ec] ${className}`}>
      <Icon name="play" size={15} className="ml-0.5" />
    </span>
  );
}

function CardText({ title, sub }: { title: string; sub?: string }) {
  return (
    <>
      <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{title}</p>
      {sub && <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">{sub}</p>}
    </>
  );
}

export function PlaylistCard({ p, fluid }: { p: Playlist; fluid?: boolean }) {
  return (
    <Link href={`/playlist/${p.id}`} className={`group ${fluid ? "block" : tile}`}>
      <div className="poster relative transition group-hover:-translate-y-0.5">
        <Cover seed={p.id} label={p.title} src={p.artwork} />
        <PlayRing />
      </div>
      <CardText title={p.title} sub={p.subtitle} />
    </Link>
  );
}

export function AlbumCard({ a, fluid }: { a: Album; fluid?: boolean }) {
  return (
    <Link href={`/album/${a.id}`} className={`group ${fluid ? "block" : tile}`}>
      <div className="poster relative transition group-hover:-translate-y-0.5">
        <Cover seed={a.id} label={a.title} src={a.artwork} />
        <PlayRing />
      </div>
      <CardText title={a.title} sub={`${a.artistName} · ${a.year}`} />
    </Link>
  );
}

/** Small ringed portrait, as in the "Trending Artist" row. */
export function ArtistBubble({ a }: { a: Artist }) {
  return (
    <Link href={`/artist/${a.id}`} className="flex w-[76px] shrink-0 flex-col items-center gap-1.5 text-center lg:w-[92px]">
      <span className="pick-glow w-[70px] lg:w-[86px]"><Cover seed={a.id} src={a.image} round /></span>
      <span className="w-full truncate text-[13px] text-[#e3ece6]">{a.name}</span>
    </Link>
  );
}

export function ArtistCard({ a, fluid }: { a: Artist; fluid?: boolean }) {
  return (
    <Link href={`/artist/${a.id}`} className={`text-center ${fluid ? "block" : "block w-[112px] shrink-0 sm:w-[128px] lg:w-auto"}`}>
      <Cover seed={a.id} src={a.image} round />
      <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{a.name}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{fmtCount(a.monthlyListeners)} listeners</p>
    </Link>
  );
}

export function ShowCard({ s, fluid }: { s: Show; fluid?: boolean }) {
  return (
    <Link href={`/shows/${s.id}`} className={`group ${fluid ? "block" : tile}`}>
      <div className="poster relative transition group-hover:-translate-y-0.5">
        <Cover seed={s.id} label={s.title} />
        <PlayRing />
      </div>
      <CardText title={s.title} sub={s.blurb} />
    </Link>
  );
}

/** A tappable settings-style row. */
export function RowLink({ href, icon, title, subtitle, trailing }: { href: string; icon: Parameters<typeof Icon>[0]["name"]; title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-2xl border border-line/70 bg-card/60 px-3 py-3 transition hover:border-primary/60 hover:bg-white/5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary"><Icon name={icon} size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-medium text-ink">{title}</span>
        {subtitle && <span className="block truncate text-[13px] font-light text-muted">{subtitle}</span>}
      </span>
      {trailing ?? <Icon name="chevron" size={18} className="shrink-0 text-primary" />}
    </Link>
  );
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-10 text-center">
      <p className="m-0 text-[17px] font-semibold text-white">{title}</p>
      <p className="m-0 max-w-sm text-[14px] font-light text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * Header block for playlist / album / show pages: a large cover with a glow behind it,
 * a small kind label, a big title, meta text and actions.
 */
export function Hero({ cover, kind, title, meta, children }: { cover: ReactNode; kind: string; title: string; meta?: string; children?: ReactNode }) {
  return (
    <div className="relative -mx-4 -mt-5 overflow-hidden px-4 pb-2 pt-6 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-8 lg:pt-8">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_80%_at_50%_0%,rgba(var(--primary-rgb),0.22),transparent_70%)]" />
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
        <div className="w-48 shrink-0 self-center drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.25)] sm:w-56 sm:self-auto">{cover}</div>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-muted">{kind}</p>
          <h1 className="m-0 mt-1 text-[34px] font-bold leading-tight text-primary sm:text-[44px]">{title}</h1>
          {meta && <p className="m-0 mt-1.5 text-[14px] font-light text-ink/85">{meta}</p>}
          {children && <div className="mt-4 flex flex-wrap items-center gap-2.5">{children}</div>}
        </div>
      </div>
    </div>
  );
}

const TILE: [string, string][] = [
  ["#2a8a5a", "#0c3a26"], ["#e08a3a", "#5a2a10"], ["#c0309a", "#4a0f55"], ["#1c6be0", "#0a2a7a"],
  ["#e8562a", "#7d1f0a"], ["#2a8a8a", "#0c2a30"], ["#5a9a2a", "#1a3a0c"], ["#d6841a", "#5a2a08"],
  ["#d63a5a", "#5a1a3a"], ["#9a5ab8", "#2a0f45"],
];

export function GenreTile({ id, name }: { id: string; name: string }) {
  const [a, b] = TILE[hashStr(id) % TILE.length];
  return (
    <Link
      href={`/genre/${id}`}
      className="relative flex h-[68px] items-start overflow-hidden rounded-xl border border-white/10 p-2.5 text-[14px] font-semibold text-white transition hover:-translate-y-0.5 sm:h-24 sm:text-[16px]"
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      {name}
      <svg viewBox="0 0 40 40" aria-hidden="true" className="absolute -bottom-1 right-1 h-11 w-11 opacity-80 sm:h-14 sm:w-14">
        <circle cx="24" cy="16" r="7" fill="#0b0b0b" />
        <path d="M10 40 C10 28 17 24 24 24 C31 24 38 28 38 40 Z" fill="#0b0b0b" />
      </svg>
    </Link>
  );
}
