import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { fmtCount } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { ArtistActions, ArtistMenu, ArtistSongs } from "@/components/artist-clients";
import { Cover } from "@/components/cover";
import { TrackList } from "@/components/track-list";
import { SpotlightTile } from "@/components/spotlight";
import { ArtistCommunityJoin } from "@/components/party-clients";
import { artistRoomInfo } from "@/lib/party";
import { AlbumCard, GoldBadge, RowLink, Section, Shelf } from "@/components/ui";

const TABS = ["home", "music", "about", "community"] as const;

export default async function ArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  await getUserId();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? sp.tab! : "home";
  const [data, followers, spotlight, room] = await Promise.all([
    catalog.getArtist(id),
    prisma.follow.count({ where: { artistId: id } }),
    catalog.getSpotlight(),
    tab === "community" ? artistRoomInfo(id) : null,
  ]);
  if (!data) notFound();
  const { artist, topTracks, albums } = data;
  const videos = spotlight.filter((s) => s.artistId === artist.id);

  return (
    <>
      <div className="relative -mx-4 -mt-3 overflow-hidden px-4 pt-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-8 lg:pt-6">
        {/* Backlit silhouette of the artist behind the header, as in the design */}
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 55% at 85% 20%, rgba(74,222,128,0.22), transparent 70%), linear-gradient(180deg, #0f2a1c 0%, #07120c 70%, transparent 100%)" }} />
        {/* Head-and-shoulders silhouette of the artist, large and behind the header (design) */}
        <svg aria-hidden="true" viewBox="0 0 240 300" className="absolute -right-10 top-10 -z-10 h-[400px] w-auto opacity-80 sm:right-4 sm:h-[440px]">
          <defs>
            <radialGradient id="ah-sil" cx="50%" cy="30%" r="70%"><stop offset="0" stopColor="#0c1a12" /><stop offset="1" stopColor="#030604" /></radialGradient>
          </defs>
          <ellipse cx="120" cy="82" rx="46" ry="56" fill="url(#ah-sil)" />
          <path d="M76 70 C74 26 166 26 164 70 C158 44 82 44 76 70 Z" fill="url(#ah-sil)" />
          <rect x="102" y="128" width="36" height="34" rx="12" fill="url(#ah-sil)" />
          <path d="M8 300 C8 210 58 160 120 160 C182 160 232 210 232 300 Z" fill="url(#ah-sil)" />
        </svg>
        <div className="flex items-center justify-between">
          <BackButton />
          <ArtistMenu artistName={artist.name} />
        </div>
        <div className="mt-2">
          <div className="relative w-[138px] rounded-full border-[3px] border-primary p-[3px] shadow-[0_0_18px_rgba(var(--primary-rgb),0.35)] sm:w-[170px]">
            <Cover seed={artist.id} src={artist.image} round className="keep-round" />
            <span aria-hidden="true" className="absolute bottom-2 right-1"><GoldBadge size={30} /></span>
          </div>
          <h1 className="m-0 mt-2 truncate text-[34px] font-bold leading-tight text-white sm:text-[44px]">{artist.name}</h1>
          <p className="m-0 mt-1 text-[14px] font-light text-ink/80">Artist · {artist.genre}</p>
        </div>

        <div className="mt-6 grid max-w-lg grid-cols-3 divide-x divide-white/15 text-center">
          <div><p className="m-0 text-[20px] font-semibold text-white">{fmtCount(followers)}</p><p className="m-0 text-[12px] font-light text-ink/80">Followers</p></div>
          <div><p className="m-0 text-[20px] font-semibold text-white">{fmtCount(artist.monthlyListeners)}</p><p className="m-0 text-[12px] font-light text-ink/80">Monthly Listeners</p></div>
          <div><p className="m-0 text-[20px] font-semibold text-white">{albums.length}</p><p className="m-0 text-[12px] font-light text-ink/80">{albums.length === 1 ? "Album" : "Albums"}</p></div>
        </div>

        <ArtistActions artistId={artist.id} artistName={artist.name} tracks={topTracks} />

        <nav aria-label="Artist sections" className="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-line-soft">
          {TABS.map((t) => (
            <Link
              key={t}
              href={t === "home" ? `/artist/${artist.id}` : `/artist/${artist.id}?tab=${t}`}
              aria-current={tab === t ? "page" : undefined}
              scroll={false}
              className={`flex-1 whitespace-nowrap px-3 pb-2.5 text-center text-[14.5px] capitalize ${tab === t ? "border-b-2 border-primary font-semibold text-primary" : "text-ink/80"}`}
            >
              {t}
            </Link>
          ))}
        </nav>
      </div>

      {tab === "home" && (
        <>
          <Section title="Popular Songs" href={`/artist/${artist.id}?tab=music`}><ArtistSongs tracks={topTracks} /></Section>
          {videos.length > 0 && (
            <Section title="Spotlight" href="/spotlight">
              <Shelf wide>{videos.map((v) => <SpotlightTile key={v.id} item={v} />)}</Shelf>
            </Section>
          )}
        </>
      )}

      {tab === "music" && (
        <>
          <Section title="Albums">
            <Shelf>{albums.map((a) => <AlbumCard key={a.id} a={a} />)}</Shelf>
          </Section>
          <Section title="All songs"><TrackList tracks={topTracks} /></Section>
        </>
      )}

      {tab === "about" && (
        <Section title={`About ${artist.name}`}>
          <p className="m-0 max-w-2xl text-[15px] font-light leading-relaxed text-ink/90">{artist.bio}</p>
          <dl className="panel mt-4 grid max-w-md grid-cols-2 gap-y-3 p-4 text-[14px]">
            <dt className="text-muted">Genre</dt><dd className="m-0 text-ink">{artist.genre}</dd>
            <dt className="text-muted">Monthly listeners</dt><dd className="m-0 text-ink">{fmtCount(artist.monthlyListeners)}</dd>
            <dt className="text-muted">Followers on Brisic</dt><dd className="m-0 text-ink">{fmtCount(followers)}</dd>
          </dl>
        </Section>
      )}

      {tab === "community" && (
        <>
          <Section title={`${artist.name} Community`}>
            <p className="m-0 -mt-1 mb-3 text-[13.5px] font-light text-muted">{fmtCount(followers)} {followers === 1 ? "fan follows" : "fans follow"} on Brisic. Listen together, chat and send gifts.</p>
            <ArtistCommunityJoin artistId={artist.id} artistName={artist.name} listening={room?.listening ?? 0} />
          </Section>
          <Section title="Support this artist">
            <div className="grid gap-2 sm:grid-cols-3">
              <RowLink href={`/artist/${artist.id}/gifts`} icon="gift" title="Send a gift" subtitle="Use your B-Coins" />
              <RowLink href={`/artist/${artist.id}/exclusive`} icon="lock" title="Exclusive content" subtitle="Unlocked just for fans" />
              <RowLink href={`/artist/${artist.id}/merch`} icon="bag" title="Merch" subtitle="Official artist items" />
            </div>
          </Section>
        </>
      )}
    </>
  );
}
