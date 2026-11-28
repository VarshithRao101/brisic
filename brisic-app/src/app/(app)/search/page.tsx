import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { catalog } from "@/lib/catalog";
import { SearchBox } from "@/components/search-box";
import { TrackList } from "@/components/track-list";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { AlbumCard, ArtistCard, Empty, GenreTile, PlaylistCard, Section, Shelf, ShowCard } from "@/components/ui";

const Heading = () => <h1 className="m-0 mb-4 hidden text-[30px] font-semibold text-white lg:block">Search</h1>;

const TYPES = ["all", "songs", "artists", "albums", "playlists", "podcasts"] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const [userId, sp] = await Promise.all([getUserId(), searchParams]);
  // Songs this user played recently, shown as soon as they tap the search field.
  const recentRows = userId
    ? await prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 60, select: { trackId: true, title: true, artistId: true, artistName: true, durationSec: true } })
    : [];
  const q = (sp.q ?? "").trim();
  const type = (TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "all";

  if (!q) {
    const [genres, artists, recentTracks] = await Promise.all([catalog.getGenres(), catalog.getTrendingArtists("week"), hydrate(uniqueByTrack(recentRows).slice(0, 20))]);
    return (
      <>
        <Heading />
        <SearchBox initial="" recentTracks={recentTracks}>
        <Section title="Genre" href="/genres">
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {genres.filter((g) => g.group === "music").slice(0, 12).map((g) => <GenreTile key={g.id} id={g.id} name={g.name} />)}
          </div>
        </Section>
        {artists.length > 0 && <Section title="Popular searches">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {artists.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link href={`/search?q=${encodeURIComponent(a.name)}`} className="flex h-12 items-center gap-3 rounded-xl border border-line px-2 transition hover:border-primary/60" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)" }}>
                  <span className="w-9 shrink-0"><Cover seed={a.id} src={a.image} round ring={false} /></span>
                  <Icon name="search" size={16} className="text-primary" />
                  <span className="flex-1 truncate text-[14.5px] text-ink">{a.name}</span>
                  <Icon name="chevron" size={16} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>}
        </SearchBox>
      </>
    );
  }

  const [r, recentTracks] = await Promise.all([catalog.search(q), hydrate(uniqueByTrack(recentRows).slice(0, 20))]);
  const total = r.tracks.length + r.artists.length + r.albums.length + r.playlists.length + r.shows.length;
  const show = (t: string) => type === "all" || type === t;

  return (
    <>
      <Heading />
      <SearchBox key={q} initial={q} recentTracks={recentTracks}>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TYPES.map((t) => (
          <Link
            key={t}
            href={`/search?q=${encodeURIComponent(q)}${t === "all" ? "" : "&type=" + t}`}
            aria-current={type === t ? "true" : undefined}
            className={`chip shrink-0 capitalize ${type === t ? "chip-on" : ""}`}
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
      </SearchBox>
    </>
  );
}
