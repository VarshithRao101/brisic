import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { Grid, PageTitle, PlaylistCard } from "@/components/ui";

export default async function SeeAllPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const section = await catalog.getSection(id);
  if (!section) notFound();
  return (
    <>
      <BackButton />
      <PageTitle title={section.title} subtitle={`${section.playlists.length} playlists`} />
      <Grid>{section.playlists.map((p) => <PlaylistCard key={p.id} p={p} fluid />)}</Grid>
    </>
  );
}
