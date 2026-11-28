import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { ExclusiveList } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function ExclusivePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const artist = await prisma.artistProfile.findUnique({
    where: { id },
    select: {
      id: true, name: true, userId: true,
      exclusives: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, kind: true, description: true, price: true, youtubeId: true, audioKey: true } },
    },
  });
  if (!artist) notFound();
  const unlocks = artist.exclusives.length
    ? await prisma.unlock.findMany({ where: { userId, itemId: { in: artist.exclusives.map((x) => "ex:" + x.id) } }, select: { itemId: true } })
    : [];
  const unlocked = new Set(unlocks.map((u) => u.itemId.slice(3)));
  const owner = artist.userId === userId;

  return (
    <>
      <BackButton />
      <PageTitle title="Exclusive Content" subtitle={`Unlock what ${artist.name} has made just for fans`} />
      <ExclusiveList
        artistName={artist.name}
        owner={owner}
        unlocked={[...unlocked]}
        // Locked items never send their YouTube id to the browser.
        items={artist.exclusives.map((x) => ({
          id: x.id, title: x.title, kind: x.kind, description: x.description, price: x.price,
          youtubeId: owner || unlocked.has(x.id) ? x.youtubeId : null, hasAudio: !!x.audioKey,
        }))}
      />
    </>
  );
}
