import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { fmtCount } from "@/lib/format";
import { BackButton, FollowButton, ShareButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { PlayButtons, TrackList } from "@/components/track-list";
import { AlbumCard, Hero, RowLink, Section, Shelf } from "@/components/ui";

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getArtist(id);
  if (!data) notFound();
  const { artist, topTracks, albums } = data;

  return (
    <>
      <BackButton />
      <Hero
        cover={<Cover seed={artist.id} label={artist.name} src={artist.image} round textSize="text-5xl" />}
        kind="Artist"
        title={artist.name}
        meta={`${fmtCount(artist.monthlyListeners)} monthly listeners · ${artist.genre}`}
      >
        <FollowButton artistId={artist.id} artistName={artist.name} />
        <Link href={`/artist/${artist.id}/support`} className="btn"><Icon name="gift" size={18} /> Support</Link>
        <ShareButton title={artist.name} />
      </Hero>

      <div className="mt-6"><PlayButtons tracks={topTracks} /></div>

      <Section title="Top Tracks"><TrackList tracks={topTracks} /></Section>

      {albums.length > 0 && (
        <Section title="Albums"><Shelf>{albums.map((a) => <AlbumCard key={a.id} a={a} />)}</Shelf></Section>
      )}

      <Section title="About">
        <p className="m-0 max-w-2xl text-[15px] font-light leading-relaxed text-ink/90">{artist.bio}</p>
      </Section>

      <Section title="Support this artist">
        <div className="panel grid gap-1 p-2 sm:grid-cols-3">
          <RowLink href={`/artist/${artist.id}/gifts`} icon="gift" title="Send a gift" subtitle="Use your B-Coins" />
          <RowLink href={`/artist/${artist.id}/exclusive`} icon="lock" title="Exclusive content" subtitle="Unlocked just for fans" />
          <RowLink href={`/artist/${artist.id}/merch`} icon="bag" title="Merch" subtitle="Official artist items" />
        </div>
      </Section>
    </>
  );
}
