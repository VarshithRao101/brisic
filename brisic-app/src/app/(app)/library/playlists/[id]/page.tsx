import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { hydrate } from "@/lib/library";
import { playlistArt } from "@/lib/playlist-art";
import { BackButton } from "@/components/controls";
import { HERO_BOX, PlaylistHero } from "@/components/playlist-view";
import { UserPlaylistView } from "@/components/library-clients";

export default async function UserPlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  const { id } = await params;
  const [user, playlist] = await Promise.all([
    requireUser(),
    prisma.userPlaylist.findFirst({
      where: { id, userId },
      include: { tracks: { orderBy: { addedAt: "asc" } } },
    }),
  ]);
  if (!playlist) notFound();
  const tracks = await hydrate(playlist.tracks);

  return (
    <>
      <div className={HERO_BOX}>
        <PlaylistHero src={playlistArt(playlist.id).hero} />
        <div className="absolute left-3 top-[10%]"><BackButton /></div>
      </div>
      <p className="m-0 mt-4 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">Your playlist</p>
      <h1 className="m-0 truncate text-[34px] font-bold leading-[1.05] text-primary sm:text-[46px]">{playlist.name}</h1>
      <p className="m-0 mt-2 text-[14px] text-ink/85">{tracks.length} {tracks.length === 1 ? "song" : "songs"} · by {user.displayName}</p>
      <UserPlaylistView key={tracks.map((t) => t.id).join("|")} id={playlist.id} name={playlist.name} tracks={tracks} />
    </>
  );
}
