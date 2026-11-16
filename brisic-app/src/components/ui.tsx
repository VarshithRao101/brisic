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

export function Section({ title, href, children }: { title: string; href?: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-[19px] font-semibold text-white">{title}</h2>
        {href && <Link href={href} className="shrink-0 text-[13.5px] font-medium text-primary hover:underline">See all</Link>}
      </div>
      {children}
    </section>
  );
}

/** Horizontal scroller on phones, wrapping grid on wide screens. */
export function Shelf({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-0 xl:grid-cols-6">
      {children}
    </div>
  );
}

export function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5 xl:grid-cols-6">{children}</div>;
}

const tile = "block w-[140px] shrink-0 sm:w-[156px] lg:w-auto";

export function PlaylistCard({ p, fluid }: { p: Playlist; fluid?: boolean }) {
  return (
    <Link href={`/playlist/${p.id}`} className={fluid ? "block" : tile}>
      <Cover seed={p.id} label={p.title} src={p.artwork} />
      <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{p.title}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{p.subtitle}</p>
    </Link>
  );
}

export function AlbumCard({ a, fluid }: { a: Album; fluid?: boolean }) {
  return (
    <Link href={`/album/${a.id}`} className={fluid ? "block" : tile}>
      <Cover seed={a.id} label={a.title} src={a.artwork} />
      <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{a.title}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{a.artistName} · {a.year}</p>
    </Link>
  );
}

export function ArtistCard({ a, fluid }: { a: Artist; fluid?: boolean }) {
  return (
    <Link href={`/artist/${a.id}`} className={`text-center ${fluid ? "block" : "block w-[112px] shrink-0 sm:w-[128px] lg:w-auto"}`}>
      <Cover seed={a.id} label={a.name} src={a.image} round textSize="text-2xl" />
      <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{a.name}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{fmtCount(a.monthlyListeners)} listeners</p>
    </Link>
  );
}

export function ShowCard({ s, fluid }: { s: Show; fluid?: boolean }) {
  return (
    <Link href={`/shows/${s.id}`} className={fluid ? "block" : tile}>
      <Cover seed={s.id} label={s.title} />
      <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{s.title}</p>
      <p className="m-0 truncate text-[12.5px] font-light text-muted">{s.blurb}</p>
    </Link>
  );
}

/** A tappable settings-style row. */
export function RowLink({ href, icon, title, subtitle, trailing }: { href: string; icon: Parameters<typeof Icon>[0]["name"]; title: string; subtitle?: string; trailing?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 rounded-2xl px-3 py-3 hover:bg-white/5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary"><Icon name={icon} size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15.5px] font-medium text-ink">{title}</span>
        {subtitle && <span className="block truncate text-[13px] font-light text-muted">{subtitle}</span>}
      </span>
      {trailing ?? <Icon name="chevron" size={18} className="shrink-0 text-muted" />}
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

/** Header block for playlist / album / artist pages. */
export function Hero({ cover, kind, title, meta, children }: { cover: ReactNode; kind: string; title: string; meta?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-left">
      <div className="w-44 shrink-0 sm:w-52">{cover}</div>
      <div className="min-w-0 flex-1">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{kind}</p>
        <h1 className="m-0 mt-1 text-[30px] font-semibold leading-tight text-white sm:text-[42px]">{title}</h1>
        {meta && <p className="m-0 mt-1.5 text-[14.5px] font-light text-muted">{meta}</p>}
        {children && <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">{children}</div>}
      </div>
    </div>
  );
}

const TILE = ["#2f7a34", "#7a2a8a", "#d6841a", "#1c6be0", "#c0309a", "#1f9a9a", "#c8452f", "#5a7d1e", "#3f51b5", "#b8860b"];

export function GenreTile({ id, name }: { id: string; name: string }) {
  return (
    <Link
      href={`/genre/${id}`}
      className="relative flex h-24 items-end overflow-hidden rounded-2xl border border-white/10 p-3 text-[17px] font-semibold text-white"
      style={{ background: `linear-gradient(135deg, ${TILE[hashStr(id) % TILE.length]}, #0a1410)` }}
    >
      {name}
    </Link>
  );
}
