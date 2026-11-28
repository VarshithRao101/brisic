import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/creators";
import { MUSIC_GENRES } from "@/lib/catalog/genres";
import { storageMode } from "@/lib/storage";
import { youtubeUploadEnabled } from "@/lib/youtube";
import { fmtCount } from "@/lib/format";
import { BackButton } from "@/components/controls";
import {
  ArtistProfileForm, EpisodeForm, EpisodeList, ExclusiveAdminList, ExclusiveForm, MerchAdminList, MerchForm, NewShowForm, SongList,
  SongUploadForm, VideoForm, VideoList,
} from "@/components/studio-clients";

export const metadata = { title: "Creator Studio · Brisic" };

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const TABS = [["overview", "Overview"], ["music", "Music"], ["videos", "Videos & Live"], ["fans", "Exclusives & Merch"], ["profile", "Profile"]] as const;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel px-4 py-3">
      <p className="m-0 text-[12.5px] font-light text-muted">{label}</p>
      <p className="m-0 text-[24px] font-bold leading-tight text-white">{value}</p>
      {sub && <p className="m-0 text-[12px] font-light text-ink/70">{sub}</p>}
    </div>
  );
}

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [access, sp] = await Promise.all([getAccess(), searchParams]);

  if (!access.role) {
    return (
      <div className="mx-auto max-w-xl">
        <BackButton />
        <div className="panel-glow p-6 text-center">
          <h1 className="m-0 text-[24px] font-bold text-white">Creator Studio</h1>
          <p className="m-0 mt-2 text-[14.5px] font-light text-ink/85">
            Brisic creators are invite-only for now. If you&apos;re an artist or podcaster, contact the Brisic team and they&apos;ll open your studio.
          </p>
          {access.isAdmin && <Link href="/admin/creators" className="btn btn-primary mt-4">Invite creators</Link>}
        </div>
      </div>
    );
  }

  const storageOn = storageMode() !== "off";

  if (access.role === "artist" && access.artistId) {
    const tab = TABS.some(([t]) => t === sp.tab) ? sp.tab! : "overview";
    const id = access.artistId;
    const artist = await prisma.artistProfile.findUnique({
      where: { id },
      select: {
        id: true, name: true, genre: true, bio: true, imageKey: true,
        songs: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, albumTitle: true, explicit: true, lyrics: true, durationSec: true, plays: true } },
        videos: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, kind: true, isLive: true, views: true } },
        exclusives: { orderBy: { createdAt: "desc" }, select: { id: true, title: true, kind: true, price: true } },
        merch: { orderBy: { createdAt: "desc" }, select: { id: true, name: true, priceNaira: true, buyUrl: true } },
      },
    });
    if (!artist) return null;

    const [followers, listeners, plays7, gifts, unlocks] = await Promise.all([
      prisma.follow.count({ where: { artistId: id } }),
      prisma.playHistory.groupBy({ by: ["userId"], where: { artistId: id, playedAt: { gte: daysAgo(30) } } }),
      prisma.playHistory.count({ where: { artistId: id, playedAt: { gte: daysAgo(7) } } }),
      prisma.gift.aggregate({ where: { artistId: id }, _sum: { coins: true }, _count: true }),
      artist.exclusives.length
        ? prisma.unlock.groupBy({ by: ["itemId"], where: { itemId: { in: artist.exclusives.map((x) => "ex:" + x.id) } }, _count: { _all: true } })
        : Promise.resolve([] as { itemId: string; _count: { _all: number } }[]),
    ]);
    const unlockCount = new Map(unlocks.map((u) => [u.itemId.slice(3), u._count._all]));
    const exclusiveCoins = artist.exclusives.reduce((n, x) => n + x.price * (unlockCount.get(x.id) ?? 0), 0);
    const giftCoins = gifts._sum.coins ?? 0;
    const totalPlays = artist.songs.reduce((n, s) => n + s.plays, 0);
    const top = [...artist.songs].sort((a, b) => b.plays - a.plays).slice(0, 5);

    return (
      <div className="mx-auto max-w-2xl">
        <BackButton />
        <h1 className="m-0 text-[28px] font-bold text-white">Creator <span className="text-primary">Studio</span></h1>
        <p className="m-0 text-[14px] font-light text-muted">{artist.name} · everything you publish appears on Brisic right away.</p>
        <nav aria-label="Studio sections" className="no-scrollbar -mx-4 mb-5 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {TABS.map(([t, label]) => (
            <Link key={t} href={t === "overview" ? "/studio" : `/studio?tab=${t}`} scroll={false} aria-current={tab === t ? "page" : undefined} className={`chip shrink-0 ${tab === t ? "chip-on" : ""}`}>{label}</Link>
          ))}
        </nav>
        {!storageOn && (tab === "music" || tab === "fans") && (
          <p className="panel m-0 mb-4 p-3 text-[13.5px] text-[#ffcf87]">File uploads open once Brisic&apos;s file storage is connected. YouTube videos, lives and links work now.</p>
        )}

        {tab === "overview" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-2.5">
              <Stat label="Total plays" value={fmtCount(totalPlays)} sub={`${fmtCount(plays7)} in the last 7 days`} />
              <Stat label="Monthly listeners" value={fmtCount(listeners.length)} sub="last 30 days" />
              <Stat label="Followers" value={fmtCount(followers)} />
              <Stat label="Catalog" value={`${artist.songs.length} songs`} sub={`${artist.videos.length} videos · ${artist.exclusives.length} exclusives`} />
            </div>
            <section className="panel-glow p-4">
              <h2 className="m-0 text-[17px] font-semibold text-white">Earnings</h2>
              <p className="m-0 mt-1 text-[32px] font-bold leading-tight text-primary">{fmtCount(giftCoins + exclusiveCoins)} B-Coins</p>
              <p className="m-0 text-[13px] font-light text-ink/80">≈ ₦{(giftCoins + exclusiveCoins).toLocaleString("en-US")} before Brisic&apos;s share</p>
              <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0 text-[14px] text-ink/90">
                <li>Gifts from fans: <b className="text-white">{fmtCount(giftCoins)} B</b> ({gifts._count} gifts)</li>
                <li>Exclusive unlocks: <b className="text-white">{fmtCount(exclusiveCoins)} B</b> ({[...unlockCount.values()].reduce((a, b) => a + b, 0)} unlocks)</li>
              </ul>
              <p className="m-0 mt-3 text-[12.5px] font-light text-muted">Payouts to your bank account open once Brisic switches on Paystack transfers. Your earnings are recorded from day one.</p>
            </section>
            <section>
              <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your top songs</h2>
              {!top.length ? <p className="m-0 text-[14px] font-light text-muted">No songs yet. <Link href="/studio?tab=music" className="text-primary">Upload your first one.</Link></p> : (
                <ol className="panel m-0 list-none divide-y divide-white/5 p-1">
                  {top.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                      <span className="w-5 text-center text-[13px] text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-[14.5px] text-white">{s.title}</span>
                      <span className="text-[13px] text-muted">{fmtCount(s.plays)} plays</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
            <div className="flex flex-wrap gap-2">
              <Link href="/studio?tab=music" className="btn btn-primary">Upload a song</Link>
              <Link href="/studio?tab=videos" className="btn">Go live</Link>
              <Link href={`/artist/${artist.id}`} className="btn">View your page</Link>
            </div>
          </div>
        )}

        {tab === "music" && (
          <div className="flex flex-col gap-5">
            {storageOn && <SongUploadForm />}
            <section>
              <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your songs ({artist.songs.length})</h2>
              <SongList songs={artist.songs} />
            </section>
          </div>
        )}

        {tab === "videos" && (
          <div className="flex flex-col gap-5">
            <VideoForm uploadEnabled={youtubeUploadEnabled()} />
            <section>
              <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your videos ({artist.videos.length})</h2>
              <VideoList videos={artist.videos} />
            </section>
          </div>
        )}

        {tab === "fans" && (
          <div className="flex flex-col gap-5">
            <ExclusiveForm storageOn={storageOn} />
            <section>
              <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your exclusives ({artist.exclusives.length})</h2>
              <ExclusiveAdminList items={artist.exclusives.map((x) => ({ ...x, unlocks: unlockCount.get(x.id) ?? 0 }))} />
            </section>
            <MerchForm storageOn={storageOn} />
            <section>
              <h2 className="m-0 mb-2 text-[17px] font-semibold text-white">Your merch ({artist.merch.length})</h2>
              <MerchAdminList items={artist.merch} />
            </section>
          </div>
        )}

        {tab === "profile" && (
          <ArtistProfileForm genres={MUSIC_GENRES} artist={{ id: artist.id, name: artist.name, genre: artist.genre, bio: artist.bio, image: artist.imageKey ? `/api/media/artist/${artist.id}` : null }} />
        )}
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
      {!storageOn && <p className="panel m-0 mb-4 p-3 text-[13.5px] text-[#ffcf87]">Audio uploads open once Brisic&apos;s file storage is connected. YouTube episodes and lives work now.</p>}
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
