import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { Cover } from "@/components/cover";
import { NewPlaylistButton } from "@/components/library-clients";
import { TrackList } from "@/components/track-list";
import { Empty, PageTitle, RowLink, Section } from "@/components/ui";

export default async function LibraryPage() {
  const user = await requireUser();
  const [likes, follows, playlists, history] = await Promise.all([
    prisma.likedTrack.count({ where: { userId: user.id } }),
    prisma.follow.count({ where: { userId: user.id } }),
    prisma.userPlaylist.findMany({
      where: { userId: user.id }, orderBy: { updatedAt: "desc" },
      select: { id: true, name: true, _count: { select: { tracks: true } } },
    }),
    prisma.playHistory.findMany({ where: { userId: user.id }, orderBy: { playedAt: "desc" }, take: 30 }),
  ]);
  const recent = await hydrate(uniqueByTrack(history).slice(0, 5));

  return (
    <>
      <PageTitle title="Library" subtitle={`@${user.handle}`} />

      <div className="panel grid gap-1 p-2 sm:grid-cols-2 lg:grid-cols-3">
        <RowLink href="/library/liked" icon="heart" title="Liked Songs" subtitle={`${likes} ${likes === 1 ? "song" : "songs"}`} />
        <RowLink href="/following" icon="users" title="Artists Followed" subtitle={`${follows} following`} />
        <RowLink href="/library/history" icon="history" title="Listening History" subtitle="Everything you played" />
        <RowLink href="/queue" icon="queue" title="Queue" subtitle="What plays next" />
        <RowLink href="/stations" icon="radio" title="Stations" subtitle="Radio" />
        <RowLink href="/party" icon="users" title="Community Party" subtitle="Listen together" />
        <RowLink href="/download" icon="download" title="Downloaded Music" subtitle="Offline listening is in the app" />
      </div>

      <Section title="Your Playlists">
        <div className="mb-4"><NewPlaylistButton /></div>
        {playlists.length === 0 ? (
          <Empty title="No playlists yet" body="Create one, then add songs from the menu on any track." />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-5">
            {playlists.map((p) => (
              <Link key={p.id} href={`/library/playlists/${p.id}`} className="block">
                <Cover seed={p.id} label={p.name} />
                <p className="m-0 mt-2 truncate text-[14.5px] font-medium text-ink">{p.name}</p>
                <p className="m-0 text-[12.5px] font-light text-muted">{p._count.tracks} {p._count.tracks === 1 ? "song" : "songs"}</p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <TrackList tracks={recent} numbered={false} showStreams={false} />
        </Section>
      )}
    </>
  );
}
