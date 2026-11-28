import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PALETTE, PLAYLIST_SHELVES } from "@/lib/catalog/home-data";
import { ART_CHOICES } from "@/lib/playlist-art";
import { PlaylistForm, PlaylistSongs } from "@/components/admin-clients";

export default async function AdminPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.editorialPlaylist.findUnique({
    where: { id },
    select: {
      id: true, title: true, subtitle: true, shelf: true, artFrom: true, hero: true,
      songs: { orderBy: { position: "asc" }, select: { song: { select: { id: true, title: true, durationSec: true, plays: true, artist: { select: { name: true } } } } } },
    },
  });
  if (!p) notFound();
  const color = PALETTE.find((c) => c.from === p.artFrom)?.name ?? PALETTE[0].name;
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link href="/admin/playlists" className="text-[14px] text-primary">← All playlists</Link>
        <Link href={`/playlist/${p.id}`} className="btn btn-sm">View as listener</Link>
      </div>
      <div className="flex flex-col gap-5">
        <PlaylistSongs playlistId={p.id} songs={p.songs.map(({ song: s }) => ({ id: s.id, title: s.title, artistName: s.artist.name, durationSec: s.durationSec, plays: s.plays }))} />
        <PlaylistForm id={p.id} choices={{ shelves: PLAYLIST_SHELVES, colors: PALETTE, art: ART_CHOICES }} initial={{ title: p.title, subtitle: p.subtitle, shelf: p.shelf, color, hero: p.hero ?? ART_CHOICES[0].id }} />
      </div>
    </>
  );
}
