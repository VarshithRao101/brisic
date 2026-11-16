import Link from "next/link";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { SearchBox } from "@/components/search-box";
import { TrackList } from "@/components/track-list";
import { AlbumCard, ArtistCard, Empty, GenreTile, PageTitle, PlaylistCard, Section, Shelf, ShowCard } from "@/components/ui";

const TYPES = ["all", "songs", "artists", "albums", "playlists", "podcasts"] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const type = (TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "all";

  if (!q) {
    const genres = await catalog.getGenres();
    return (
      <>
        <PageTitle title="Search" />
        <SearchBox initial="" />
        <Section title="Browse genres" href="/genres">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {genres.filter((g) => g.group === "music").slice(0, 12).map((g) => <GenreTile key={g.id} id={g.id} name={g.name} />)}
          </div>
        </Section>
      </>
    );
  }

  const r = await catalog.search(q);
  const total = r.tracks.length + r.artists.length + r.albums.length + r.playlists.length + r.shows.length;
  const show = (t: string) => type === "all" || type === t;

  return (
    <>
      <PageTitle title="Search" />
      <SearchBox key={q} initial={q} />
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(q)}${t === "all" ? "" : "&type=" + t}`}
            aria-current={type === t ? "true" : undefined}
            className={`btn btn-sm shrink-0 capitalize ${type === t ? "btn-primary" : "font-normal"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      {total === 0 && (
        <div className="mt-8">
          <Empty title={`No results for “${q}”`} body="Check the spelling, or try an artist, a song title or a genre." />
        </div>
      )}
      {show("songs") && r.tracks.length > 0 && <Section title="Songs"><TrackList tracks={r.tracks} numbered={false} /></Section>}
      {show("artists") && r.artists.length > 0 && <Section title="Artists"><Shelf>{r.artists.map((a) => <ArtistCard key={a.id} a={a} />)}</Shelf></Section>}
      {show("albums") && r.albums.length > 0 && <Section title="Albums"><Shelf>{r.albums.map((a) => <AlbumCard key={a.id} a={a} />)}</Shelf></Section>}
      {show("playlists") && r.playlists.length > 0 && <Section title="Playlists"><Shelf>{r.playlists.map((p) => <PlaylistCard key={p.id} p={p} />)}</Shelf></Section>}
      {show("podcasts") && r.shows.length > 0 && <Section title="Podcasts"><Shelf>{r.shows.map((s) => <ShowCard key={s.id} s={s} />)}</Shelf></Section>}
    </>
  );
}
