import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { hydrate } from "@/lib/library";
import { BackButton } from "@/components/controls";
import { Cover } from "@/components/cover";
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
      <BackButton />
      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0 sm:w-32"><Cover seed={playlist.id} label={playlist.name} /></div>
        <div className="min-w-0">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Your playlist</p>
          <h1 className="m-0 mt-1 truncate text-[26px] font-semibold text-white sm:text-[34px]">{playlist.name}</h1>
          <p className="m-0 mt-1 text-[14px] font-light text-muted">{tracks.length} {tracks.length === 1 ? "song" : "songs"} · by {user.displayName}</p>
        </div>
      </div>
      <UserPlaylistView key={tracks.map((t) => t.id).join("|")} id={playlist.id} name={playlist.name} tracks={tracks} />
    </>
  );
}
