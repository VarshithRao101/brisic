import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton, ShareButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { PlayButtons, TrackList } from "@/components/track-list";
import { Hero } from "@/components/ui";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getPlaylist(id);
  if (!data) notFound();
  const { playlist, tracks } = data;
  const minutes = Math.round(tracks.reduce((n, t) => n + t.durationSec, 0) / 60);

  return (
    <>
      <BackButton />
      <Hero
        cover={<Cover seed={playlist.id} label={playlist.title} src={playlist.artwork} textSize="text-2xl" />}
        kind="Playlist"
        title={playlist.title}
        meta={`${playlist.subtitle} · ${tracks.length} songs · ${minutes} min`}
      >
        <PlayButtons tracks={tracks} />
        <ShareButton title={playlist.title} />
      </Hero>
      <div className="mt-6"><TrackList tracks={tracks} /></div>
    </>
  );
}
