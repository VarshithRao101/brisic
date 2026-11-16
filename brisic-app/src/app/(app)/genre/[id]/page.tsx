import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { PlayButtons, TrackList } from "@/components/track-list";
import { ArtistCard, PlaylistCard, Section, Shelf, ShowCard } from "@/components/ui";

const KIND = { music: "Genre", podcasts: "Podcasts", moods: "Mood" } as const;

export default async function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await catalog.getGenre(id);
  if (!data) notFound();
  const { genre, tracks, artists, playlists } = data;
  const isPodcast = genre.group === "podcasts";
  const shows = isPodcast ? await catalog.getShows() : [];

  return (
    <>
      <BackButton />
      <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{KIND[genre.group]}</p>
      <h1 className="m-0 mt-1 text-[32px] font-semibold leading-tight text-white sm:text-[44px]">{genre.name}</h1>
      <p className="m-0 mt-1.5 text-[15px] font-light text-muted">{genre.blurb}</p>

      {isPodcast ? (
        <Section title="Shows"><Shelf>{shows.map((s) => <ShowCard key={s.id} s={s} />)}</Shelf></Section>
      ) : (
        <>
          <div className="mt-5"><PlayButtons tracks={tracks} /></div>
          <Section title={`Top ${genre.name} songs`}><TrackList tracks={tracks} /></Section>
          {artists.length > 0 && <Section title="Popular artists"><Shelf>{artists.map((a) => <ArtistCard key={a.id} a={a} />)}</Shelf></Section>}
          {playlists.length > 0 && <Section title="Playlists"><Shelf>{playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}</Shelf></Section>}
        </>
      )}
    </>
  );
}
