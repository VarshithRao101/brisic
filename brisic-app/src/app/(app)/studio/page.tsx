import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/creators";
import { storageMode } from "@/lib/storage";
import { youtubeUploadEnabled } from "@/lib/youtube";
import { BackButton } from "@/components/controls";
import {
  ArtistProfileForm, EpisodeForm, EpisodeList, NewShowForm, SongList, SongUploadForm, VideoForm, VideoList,
} from "@/components/studio-clients";

export const metadata = { title: "Creator Studio · Brisic" };

export default async function StudioPage() {
  const access = await getAccess();

  if (!access.role) {
    return (
      <div className="mx-auto max-w-xl">
        <BackButton />
        <div className="panel-glow p-6 text-center">
          <h1 className="m-0 text-[24px] font-bold text-white">Creator Studio</h1>
          <p className="m-0 mt-2 text-[14.5px] font-light text-ink/85">
            Brisic creators are invite-only for now. If you&apos;re an artist or podcaster, contact the Brisic team and they&apos;ll open your studio.
          </p>
          {access.isAdmin && <Link href="/admin" className="btn btn-primary mt-4">Invite creators</Link>}
        </div>
      </div>
    );
  }

  const storageOff = storageMode() === "off";

  if (access.role === "artist" && access.artistId) {
    const artist = await prisma.artistProfile.findUnique({
      where: { id: access.artistId },
      select: {
        id: true, name: true, genre: true, bio: true, imageKey: true,
        songs: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, durationSec: true, plays: true } },
        videos: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, kind: true, isLive: true, views: true } },
      },
    });
    if (!artist) return null;
    return (
      <div className="mx-auto max-w-2xl">
        <BackButton />
        <h1 className="m-0 text-[28px] font-bold text-white">Creator <span className="text-primary">Studio</span></h1>
        <p className="m-0 mb-5 text-[14px] font-light text-muted">Upload songs, add videos and go live. Everything appears on Brisic right away.</p>
        {storageOff && <p className="panel m-0 mb-4 p-3 text-[13.5px] text-[#ffcf87]">Song uploads open once Brisic&apos;s file storage is connected. YouTube videos and lives work now.</p>}
        <div className="flex flex-col gap-5">
          <ArtistProfileForm artist={{ id: artist.id, name: artist.name, genre: artist.genre, bio: artist.bio, image: artist.imageKey ? `/api/media/artist/${artist.id}` : null }} />
          <SongUploadForm />
          <section>
            <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your songs ({artist.songs.length})</h2>
            <SongList songs={artist.songs} />
          </section>
          <VideoForm uploadEnabled={youtubeUploadEnabled()} />
          <section>
            <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your videos ({artist.videos.length})</h2>
            <VideoList videos={artist.videos} />
          </section>
        </div>
      </div>
    );
  }

  // Podcaster
  const shows = await prisma.podcastShow.findMany({
    where: { userId: access.userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, title: true,
      episodes: { orderBy: { number: "desc" }, select: { id: true, number: true, title: true, isLive: true, youtubeId: true, audioKey: true } },
    },
  });
  return (
    <div className="mx-auto max-w-2xl">
      <BackButton />
      <h1 className="m-0 text-[28px] font-bold text-white">Podcast <span className="text-primary">Studio</span></h1>
      <p className="m-0 mb-5 text-[14px] font-light text-muted">Publish episodes from YouTube (video or live) and add an audio-only version for the Listen player.</p>
      <div className="flex flex-col gap-5">
        {shows.map((s) => (
          <section key={s.id} className="panel p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="m-0 truncate text-[18px] font-semibold text-white">{s.title}</h2>
              <Link href={`/shows/${s.id}`} className="btn btn-sm">View show</Link>
            </div>
            <EpisodeList episodes={s.episodes.map((e) => ({ id: e.id, number: e.number, title: e.title, isLive: e.isLive, hasVideo: !!e.youtubeId, hasAudio: !!e.audioKey }))} />
            <EpisodeForm showId={s.id} />
          </section>
        ))}
        <NewShowForm />
      </div>
    </div>
  );
}
