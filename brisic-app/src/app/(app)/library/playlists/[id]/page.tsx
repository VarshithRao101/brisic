import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { hydrate } from "@/lib/library";
import Image from "next/image";
import { hashStr } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { SilkWaves } from "@/components/playlist-view";
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
      <div className="relative -mx-4 -mt-3 h-[280px] overflow-hidden sm:-mx-6 lg:mx-0 lg:mt-0 lg:rounded-3xl">
        <SilkWaves seed={hashStr(playlist.id)} />
        <Image src="/assets/logo-b-glow.png" alt="" width={333} height={640} priority className="logo-b absolute left-1/2 top-6 h-[140px] w-auto -translate-x-1/2 drop-shadow-[0_0_22px_rgba(var(--primary-rgb),0.85)]" />
        <div className="absolute left-4 top-4"><BackButton /></div>
        <div className="absolute inset-x-4 bottom-3 sm:inset-x-6">
          <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">Your playlist</p>
          <h1 className="m-0 truncate text-[36px] font-bold leading-[1.05] text-primary sm:text-[48px]">{playlist.name}</h1>
        </div>
      </div>
      <p className="m-0 mt-2 text-[14px] text-ink/85">{tracks.length} {tracks.length === 1 ? "song" : "songs"} · by {user.displayName}</p>
      <UserPlaylistView key={tracks.map((t) => t.id).join("|")} id={playlist.id} name={playlist.name} tracks={tracks} />
    </>
  );
}
