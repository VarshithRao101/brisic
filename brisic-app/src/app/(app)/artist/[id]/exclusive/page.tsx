import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { ExclusiveList } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function ExclusivePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await catalog.getArtist(id);
  if (!data) notFound();
  const { artist } = data;
  const prefix = artist.id + ":";
  const unlocks = await prisma.unlock.findMany({ where: { userId: user.id, itemId: { startsWith: prefix } }, select: { itemId: true } });

  return (
    <>
      <BackButton />
      <PageTitle title="Exclusive Content" subtitle={`Unlock what ${artist.name} has locked just for fans`} />
      <ExclusiveList artistId={artist.id} artistName={artist.name} unlocked={unlocks.map((u) => u.itemId.slice(prefix.length))} />
    </>
  );
}
