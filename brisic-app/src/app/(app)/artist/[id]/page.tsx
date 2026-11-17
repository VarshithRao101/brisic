import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { fmtCount } from "@/lib/format";
import { BackButton, FollowButton, ShareButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { PlayButtons, TrackList } from "@/components/track-list";
import { SpotlightTile } from "@/components/spotlight";
import { AlbumCard, RowLink, Section, Shelf } from "@/components/ui";

const TABS = ["home", "music", "about", "community"] as const;

export default async function ArtistPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  await getUserId();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tab = (TABS as readonly string[]).includes(sp.tab ?? "") ? sp.tab! : "home";
  const [data, followers, spotlight] = await Promise.all([
    catalog.getArtist(id),
    prisma.follow.count({ where: { artistId: id } }),
    catalog.getSpotlight(),
  ]);
  if (!data) notFound();
  const { artist, topTracks, albums } = data;
  const videos = spotlight.filter((s) => s.artistId === artist.id);

  return (
    <>
      <div className="relative -mx-4 -mt-3 overflow-hidden px-4 pt-3 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-8 lg:pt-6">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_70%_at_20%_10%,rgba(var(--primary-rgb),0.28),transparent_70%)]" />
        <BackButton />
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative w-[104px] shrink-0 sm:w-[150px]">
            <Cover seed={artist.id} src={artist.image} round />
            <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-[#f2c94c] text-black sm:h-7 sm:w-7">
              <Icon name="check" size={14} />
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="m-0 flex items-center gap-2 text-[28px] font-bold leading-tight text-white sm:text-[40px]">
              <span className="truncate">{artist.name}</span>
              <Icon name="check" size={18} className="shrink-0 rounded-full bg-primary p-[2px] text-primary-ink" />
            </h1>
            <p className="m-0 text-[13px] font-light text-muted">Artist · {artist.genre}</p>
          </div>
        </div>
        <p className="m-0 mt-4 text-[13.5px] font-semibold text-primary">Music. Culture. Africa.</p>
        <p className="m-0 mt-1 line-clamp-2 max-w-2xl text-[14px] font-light text-ink/85">{artist.bio}</p>

        <div className="mt-4 grid max-w-md grid-cols-3 text-center">
          <div><p className="m-0 text-[20px] font-semibold text-white">{fmtCount(followers)}</p><p className="m-0 text-[12px] font-light text-muted">Followers on Brisic</p></div>
          <div><p className="m-0 text-[20px] font-semibold text-white">{fmtCount(artist.monthlyListeners)}</p><p className="m-0 text-[12px] font-light text-muted">Monthly Listeners</p></div>
          <div><p className="m-0 text-[20px] font-semibold text-white">{albums.length}</p><p className="m-0 text-[12px] font-light text-muted">{albums.length === 1 ? "Album" : "Albums"}</p></div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <PlayButtons tracks={topTracks} label="Play Artist" />
          <FollowButton artistId={artist.id} artistName={artist.name} small />
          <Link href={`/artist/${artist.id}/support`} className="btn btn-outline btn-sm"><Icon name="gift" size={16} /> Support Artist</Link>
          <ShareButton title={artist.name} />
        </div>

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
          <Section title="Popular Songs"><TrackList tracks={topTracks} /></Section>
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
            <div className="panel-glow max-w-xl p-4">
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">● Community Party</p>
              <p className="m-0 mt-1 text-[18px] font-semibold text-white">{artist.name} Listening Room</p>
              <p className="m-0 mt-1 text-[13.5px] font-light text-ink/80">Join fans in the room to listen live, vote the next song and chat.</p>
              <Link href={`/party?create=1&name=${encodeURIComponent(artist.name + " Listening Room")}`} className="btn btn-outline mt-3 w-full">Start a {artist.name} party</Link>
              <p className="m-0 mt-2 text-center text-[12px] font-light text-muted">Share the party code with other fans so they can join.</p>
            </div>
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
