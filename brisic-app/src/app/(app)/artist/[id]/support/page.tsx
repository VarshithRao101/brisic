import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { PageTitle, RowLink } from "@/components/ui";

export default async function SupportPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await catalog.getArtist(id);
  if (!data) notFound();
  const { artist } = data;
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="Fan Support" subtitle={`Support ${artist.name} directly`} />
      <div className="panel p-2">
        <RowLink href={`/artist/${artist.id}/gifts`} icon="gift" title="B-Coins" subtitle={`Send B-Coins to support ${artist.name}`} />
        <RowLink href={`/artist/${artist.id}/merch`} icon="bag" title="Merch & Purchases" subtitle="Buy merch and other artist items" />
        <RowLink href={`/artist/${artist.id}/exclusive`} icon="lock" title="Exclusive Content" subtitle="Unlock new music, bonus content and special experiences" />
      </div>
    </div>
  );
}
