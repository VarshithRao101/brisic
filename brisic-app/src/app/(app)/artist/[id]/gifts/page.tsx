import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { GiftSender } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function GiftsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await catalog.getArtist(id);
  if (!data) notFound();
  return (
    <>
      <BackButton />
      <PageTitle title="Send a Gift" />
      <GiftSender artistId={data.artist.id} artistName={data.artist.name} />
    </>
  );
}
