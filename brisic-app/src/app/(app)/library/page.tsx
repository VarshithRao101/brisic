import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { Cover } from "@/components/cover";
import { Icon, type IconName } from "@/components/icons";
import { NewPlaylistButton } from "@/components/library-clients";
import { TrackCard } from "@/components/track-list";
import { Section, Shelf } from "@/components/ui";

function HeartCover() {
  return (
    <div aria-hidden="true" className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10" style={{ background: "linear-gradient(150deg, rgba(var(--primary-rgb),0.85), #10381a)" }}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 drop-shadow-[0_0_12px_rgba(var(--primary-rgb),0.8)]" fill="var(--accent)">
        <path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.2 11c-2.2 4.6-9.2 9-9.2 9z" />
      </svg>
    </div>
  );
}

const ROWS: { href: string; icon: IconName; title: string; badge: string }[] = [
  { href: "/queue", icon: "queue", title: "Queue", badge: "Up next" },
  { href: "/stations", icon: "radio", title: "Stations", badge: "Radio" },
  { href: "/download", icon: "download", title: "Downloaded Music", badge: "In the app" },
  { href: "/library/history", icon: "history", title: "Listening History", badge: "" },
  { href: "/party", icon: "users", title: "Community Party", badge: "Live" },
  { href: "/trending", icon: "trending", title: "Charts", badge: "New" },
];

export default async function LibraryPage() {
  const userId = await getUserId();
  const [user, likes, follows, playlists, history] = await Promise.all([
    requireUser(),
    prisma.likedTrack.count({ where: { userId } }),
    prisma.follow.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { artistId: true, artistName: true }, take: 20 }),
    prisma.userPlaylist.findMany({
      where: { userId }, orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, _count: { select: { tracks: true } } },
    }),
    prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 30 }),
  ]);
  const recent = await hydrate(uniqueByTrack(history).slice(0, 8));

  return (
    <>
      <h1 className="m-0 mb-4 hidden text-[30px] font-semibold text-white lg:block">Library</h1>

      <Link href="/profile" className="panel-glow flex items-center gap-3.5 p-3.5">
        <span className="ring-glow h-14 w-14 shrink-0 overflow-hidden rounded-full p-[1px]">
          {user.image ? (
            <Image src={user.image} alt="" width={56} height={56} unoptimized={user.image.startsWith("/api/")} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full text-[22px] font-semibold text-white" style={{ background: "linear-gradient(#c9803a,#5a2f14)" }}>{user.displayName[0]?.toUpperCase()}</span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-semibold text-white">{user.displayName}</span>
          <span className="block truncate text-[13px] font-light text-muted">@{user.handle}</span>
          <span className="flex items-center gap-1 text-[12.5px] text-primary">Edit Profile <Icon name="chevron" size={12} /></span>
        </span>
        <span className="border-l border-line pl-4 pr-2 text-center">
          <span className="block text-[22px] font-semibold text-white">{follows.length}</span>
          <span className="block text-[12px] font-light text-muted">Following</span>
        </span>
      </Link>

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <Shelf>{recent.map((t, i) => <TrackCard key={t.id} tracks={recent} index={i} />)}</Shelf>
        </Section>
      )}

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="m-0 flex items-center gap-2 text-[20px] font-normal text-[#f1f7f3]">Your Playlists <Icon name="chevron" size={18} className="text-primary" /></h2>
          <NewPlaylistButton />
        </div>
        <Shelf>
          <Link href="/library/liked" className="block w-[156px] shrink-0 sm:w-[176px] lg:w-auto">
            <HeartCover />
            <p className="m-0 mt-2.5 truncate text-[15px] text-ink">Liked Songs</p>
            <p className="m-0 mt-0.5 text-[13px] font-light text-muted">{likes} {likes === 1 ? "song" : "songs"}</p>
          </Link>
          {playlists.map((p) => (
            <Link key={p.id} href={`/library/playlists/${p.id}`} className="block w-[156px] shrink-0 sm:w-[176px] lg:w-auto">
              <Cover seed={p.id} label={p.name} />
              <p className="m-0 mt-2.5 truncate text-[15px] text-ink">{p.name}</p>
              <p className="m-0 mt-0.5 text-[13px] font-light text-muted">{p._count.tracks} {p._count.tracks === 1 ? "song" : "songs"}</p>
            </Link>
          ))}
        </Shelf>
      </section>

      <Section title="Artists Followed" href="/following">
        {follows.length === 0 ? (
          <p className="m-0 text-[14px] font-light text-muted">
            Follow artists to see them here. <Link href="/trending" className="text-primary">Find artists</Link>
          </p>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0">
            {follows.map((f) => (
              <Link key={f.artistId} href={`/artist/${f.artistId}`} className="w-[118px] shrink-0 text-center">
                <Cover seed={f.artistId} round />
                <span className="mt-2 flex items-center justify-center gap-1 text-[14px] text-ink">
                  <span className="truncate">{f.artistName}</span>
                  <Icon name="check" size={13} className="shrink-0 rounded-full bg-primary p-[1px] text-primary-ink" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <ul className="m-0 mt-7 grid list-none gap-2 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {ROWS.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="flex h-12 items-center gap-3 rounded-xl border border-line px-3.5 transition hover:border-primary/60" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)" }}>
              <span className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-primary"><Icon name={r.icon} size={16} /></span>
              <span className="flex-1 text-[15px] text-ink">{r.title}</span>
              {r.badge && <span className="text-[12px] text-muted">{r.badge}</span>}
              <Icon name="chevron" size={16} className="text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
