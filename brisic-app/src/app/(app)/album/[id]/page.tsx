import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton, ShareButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { PlayButtons, TrackList } from "@/components/track-list";
import { Hero } from "@/components/ui";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getAlbum(id);
  if (!data) notFound();
  const { album, tracks } = data;
  const minutes = Math.round(tracks.reduce((n, t) => n + t.durationSec, 0) / 60);

  return (
    <>
      <BackButton />
      <Hero
        cover={<Cover seed={album.id} label={album.title} src={album.artwork} textSize="text-2xl" />}
        kind="Album"
        title={album.title}
        meta={`${album.year} · ${tracks.length} songs · ${minutes} min`}
      >
        <PlayButtons tracks={tracks} />
        <ShareButton title={`${album.title} by ${album.artistName}`} />
      </Hero>
      <p className="m-0 mt-4 text-[15px] text-muted">
        By <Link href={`/artist/${album.artistId}`} className="font-medium text-primary hover:underline">{album.artistName}</Link>
      </p>
      <div className="mt-4"><TrackList tracks={tracks} /></div>
    </>
  );
}
