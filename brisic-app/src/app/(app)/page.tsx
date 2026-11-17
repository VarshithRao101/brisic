import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { ArtistBubble, PlaylistCard, Section, Shelf } from "@/components/ui";
import { TrackCard } from "@/components/track-list";
import { SpotlightCard } from "@/components/spotlight";
import { Icon } from "@/components/icons";

export default async function HomePage() {
  const userId = await getUserId();
  const [sections, trending, history, spotlight] = await Promise.all([
    catalog.getHomeSections(),
    catalog.getTrendingArtists("week"),
    prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 40 }),
    catalog.getSpotlight(),
  ]);
  const recent = await hydrate(uniqueByTrack(history).slice(0, 8));
  const genreOf = new Map(trending.map((a) => [a.id, a.genre]));
  const spotArtists = spotlight.filter((s, i, all) => all.findIndex((x) => x.artistId === s.artistId) === i).slice(0, 6);
  const [first, ...rest] = sections;

  return (
    <>
      <h1 className="sr-only">Listen now</h1>

      <Section title="Trending Artist" href="/trending">
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {trending.slice(0, 10).map((a) => <ArtistBubble key={a.id} a={a} />)}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <Shelf>{recent.map((t, i) => <TrackCard key={t.id} tracks={recent} index={i} />)}</Shelf>
        </Section>
      )}

      {first && (
        <Section title={first.title} href={`/see-all/${first.id}`}>
          <Shelf>{first.playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}</Shelf>
        </Section>
      )}

      <Section title="Artist Spotlight" href="/spotlight">
        <Shelf>{spotArtists.map((s) => <SpotlightCard key={s.id} item={s} genre={genreOf.get(s.artistId)} />)}</Shelf>
      </Section>

      <Link href="/party" className="panel-glow mt-7 flex items-center gap-4 p-4 transition hover:brightness-110">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-primary/60 bg-black/30 text-primary">
          <Icon name="users" size={28} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-primary">● Community Party</span>
          <span className="block text-[18px] font-semibold text-white">Listen together, live</span>
          <span className="block truncate text-[13px] font-light text-ink/80">Start a room, vote what plays next and chat with fans.</span>
        </span>
        <Icon name="chevron" size={20} className="shrink-0 text-primary" />
      </Link>

      {rest.map((s) => (
        <Section key={s.id} title={s.title} href={`/see-all/${s.id}`}>
          <Shelf>{s.playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}</Shelf>
        </Section>
      ))}
    </>
  );
}
