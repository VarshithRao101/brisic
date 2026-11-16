import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { BackButton } from "@/components/controls";
import { ClearHistoryButton } from "@/components/library-clients";
import { TrackList } from "@/components/track-list";
import { Empty, PageTitle } from "@/components/ui";

export default async function HistoryPage() {
  const user = await requireUser();
  const rows = await prisma.playHistory.findMany({ where: { userId: user.id }, orderBy: { playedAt: "desc" }, take: 200 });
  const tracks = await hydrate(uniqueByTrack(rows).slice(0, 100));
  return (
    <>
      <BackButton />
      <PageTitle title="Listening History" subtitle="Most recent first" action={tracks.length > 0 ? <ClearHistoryButton /> : undefined} />
      {tracks.length === 0 ? (
        <Empty title="Nothing played yet" body="Songs you play show up here. Turn on Private session in Settings to pause history." />
      ) : (
        <TrackList tracks={tracks} numbered={false} showStreams={false} />
      )}
    </>
  );
}
