import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { WatchPlayer } from "@/components/podcast-clients";

/** Video podcast episode. Full screen: the app shell hides its header and tabs here. */
export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getEpisode(id);
  if (!data) notFound();
  return <WatchPlayer key={data.episode.id} show={data.show} episode={data.episode} more={data.more} />;
}
