import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { ShowView } from "@/components/podcast-clients";

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getShow(id);
  if (!data) notFound();
  return <ShowView show={data.show} episodes={data.episodes} />;
}
