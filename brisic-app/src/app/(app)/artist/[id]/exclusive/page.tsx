import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { ExclusiveList } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function ExclusivePage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const prefix = id + ":";
  const [data, unlocks] = await Promise.all([
    catalog.getArtist(id),
    prisma.unlock.findMany({ where: { userId, itemId: { startsWith: prefix } }, select: { itemId: true } }),
  ]);
  if (!data) notFound();
  const { artist } = data;

  return (
    <>
      <BackButton />
      <PageTitle title="Exclusive Content" subtitle={`Unlock what ${artist.name} has locked just for fans`} />
      <ExclusiveList artistId={artist.id} artistName={artist.name} unlocked={unlocks.map((u) => u.itemId.slice(prefix.length))} />
    </>
  );
}
