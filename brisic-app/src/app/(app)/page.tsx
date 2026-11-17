import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { ArtistCard, PlaylistCard, Section, Shelf } from "@/components/ui";
import { TrackList } from "@/components/track-list";

export default async function HomePage() {
  const userId = await getUserId();
  const [user, sections, trending, history] = await Promise.all([
    requireUser(),
    catalog.getHomeSections(),
    catalog.getTrendingArtists("week"),
    prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 40 }),
  ]);
  const recent = await hydrate(uniqueByTrack(history).slice(0, 6));
  const first = user.displayName.split(" ")[0];

  return (
    <>
      <div className="mb-6">
        <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.16em] text-accent">Listen now</p>
        <h1 className="m-0 mt-1 text-[28px] font-semibold leading-tight text-white sm:text-[34px]">Welcome back, {first}</h1>
      </div>

      <Section title="Trending Artists" href="/trending">
        <Shelf>{trending.slice(0, 6).map((a) => <ArtistCard key={a.id} a={a} />)}</Shelf>
      </Section>

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <div className="grid gap-x-6 lg:grid-cols-2">
            <TrackList tracks={recent.slice(0, 3)} numbered={false} showStreams={false} />
            <div className="hidden lg:block"><TrackList tracks={recent.slice(3, 6)} numbered={false} showStreams={false} /></div>
          </div>
        </Section>
      )}

      {sections.map((s) => (
        <Section key={s.id} title={s.title} href={`/see-all/${s.id}`}>
          <Shelf>{s.playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}</Shelf>
        </Section>
      ))}
    </>
  );
}
