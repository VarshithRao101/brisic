import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { hydrate } from "@/lib/library";
import { BackButton } from "@/components/controls";
import { PlayButtons, TrackList } from "@/components/track-list";
import { Empty, PageTitle } from "@/components/ui";

export default async function LikedPage() {
  const user = await requireUser();
  const rows = await prisma.likedTrack.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 500 });
  const tracks = await hydrate(rows);
  return (
    <>
      <BackButton />
      <PageTitle title="Liked Songs" subtitle={`${tracks.length} ${tracks.length === 1 ? "song" : "songs"}`} />
      {tracks.length === 0 ? (
        <Empty title="Songs you like will appear here" body="Tap the heart on any song to save it." action={<Link href="/" className="btn btn-primary">Find music</Link>} />
      ) : (
        <>
          <PlayButtons tracks={tracks} />
          <div className="mt-5"><TrackList tracks={tracks} showStreams={false} /></div>
        </>
      )}
    </>
  );
}
