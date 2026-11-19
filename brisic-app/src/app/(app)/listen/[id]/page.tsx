import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { ListenPlayer } from "@/components/podcast-clients";

export const metadata = { title: "Listening · Brisic" };

/** Audio-only podcast player. Full screen: the app shell hides its header and tabs here. */
export default async function ListenPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getEpisode(id);
  if (!data) notFound();
  const show = await catalog.getShow(data.show.id);
  return <ListenPlayer key={data.episode.id} show={data.show} episode={data.episode} episodes={show?.episodes ?? [data.episode]} />;
}
