import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { MerchGrid } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function MerchPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const artist = await prisma.artistProfile.findUnique({
    where: { id },
    select: { name: true, merch: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, priceNaira: true, description: true, imageKey: true, buyUrl: true } } },
  });
  if (!artist) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="Merch" subtitle={`Official merch from ${artist.name}`} />
      <MerchGrid
        artistName={artist.name}
        items={artist.merch.map((m) => ({ id: m.id, name: m.name, priceNaira: m.priceNaira, description: m.description, buyUrl: m.buyUrl, image: m.imageKey ? `/api/media/merch/${m.id}` : null }))}
      />
    </div>
  );
}
