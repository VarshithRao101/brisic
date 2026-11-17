import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { MerchGrid } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function MerchPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getArtist(id);
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="Merch" subtitle={`Official merch from ${data.artist.name}`} />
      <MerchGrid />
    </div>
  );
}
