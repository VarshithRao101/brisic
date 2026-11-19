import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { playlistArt } from "@/lib/playlist-art";
import { PlaylistView } from "@/components/playlist-view";

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const data = await catalog.getPlaylist(id);
  if (!data) notFound();
  const { playlist, tracks } = data;
  const saved = await prisma.userPlaylist.findFirst({ where: { userId, name: playlist.title.slice(0, 60) }, select: { id: true } });

  return (
    <PlaylistView
      playlist={{ id: playlist.id, title: playlist.title, subtitle: playlist.subtitle }}
      tracks={tracks}
      saved={!!saved}
      art={playlistArt(playlist.id)}
    />
  );
}
