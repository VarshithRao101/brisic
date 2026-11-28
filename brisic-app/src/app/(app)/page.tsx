import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { PALETTE, SPOTLIGHT_ART } from "@/lib/catalog/home-data";
import { getAccess } from "@/lib/creators";
import { hashStr } from "@/lib/format";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { homeParties } from "@/lib/party";
import { ArtistBubble, Empty, PlayRing, PlaylistCard, Section, Shelf } from "@/components/ui";
import { ArtCover } from "@/components/cover";
import { TrackCard } from "@/components/track-list";

const poster = (name: string) => name.toUpperCase().split(/\s+/).slice(0, 3).join("\n");

export default async function HomePage() {
  const userId = await getUserId();
  const [sections, trending, history, spotlight, parties, access] = await Promise.all([
    catalog.getHomeSections(),
    catalog.getTrendingArtists("week"),
    prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 40 }),
    catalog.getSpotlight(),
    homeParties(),
    getAccess(),
  ]);
  const recent = await hydrate(uniqueByTrack(history).slice(0, 10));
  const spotArtists = spotlight.filter((s, i, all) => all.findIndex((x) => x.artistId === s.artistId) === i).slice(0, 8);
  const rooms = [
    ...parties.featured.map((r) => ({ ...r, by: "" })),
    ...parties.live.map((r) => ({ code: r.code, name: r.name, listening: r.listening, by: r.hostName })),
  ];
  const nothing = !trending.length && !recent.length && !rooms.length && !sections.some((s) => s.kind !== "parties");

  return (
    <>
      <h1 className="sr-only">Listen now</h1>

      {nothing && (
        <div className="mt-4">
          <Empty
            title="Brisic is just getting started"
            body="Our artists and podcasters are uploading their music and shows right now. New songs, playlists and live parties appear here as soon as they're published."
            action={
              access.role ? <Link href="/studio" className="btn btn-primary">Open your studio</Link>
                : access.isAdmin ? <Link href="/admin" className="btn btn-primary">Open Admin</Link>
                : <Link href="/party" className="btn btn-primary">Start a listening party</Link>
            }
          />
        </div>
      )}

      {trending.length > 0 && (
        <Section title="Trending Artist" href="/trending">
          <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
            {trending.slice(0, 12).map((a) => <ArtistBubble key={a.id} a={a} />)}
          </div>
        </Section>
      )}

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <Shelf>{recent.map((t, i) => <TrackCard key={t.id} tracks={recent} index={i} />)}</Shelf>
        </Section>
      )}

      {sections.map((s) => {
        if (s.kind === "parties") {
          if (!rooms.length) return null;
          // Join only: rooms Brisic features (always open), plus listener parties that are live now.
          return (
            <Section key={s.id} title={s.title} href="/party">
              <Shelf>
                {rooms.map((r) => {
                  const c = PALETTE[hashStr(r.code) % PALETTE.length];
                  return (
                    <Link key={r.code} href={`/party/${r.code}`} className="group block w-[160px] shrink-0 sm:w-[176px] lg:w-auto">
                      <div className="poster relative transition group-hover:-translate-y-0.5">
                        <ArtCover art={{ from: c.from, to: c.to, label: poster(r.name), figure: "person", px: 92, pfill: "#050505" }} />
                        <span className="poster-label absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff4a4a]" /> LIVE
                        </span>
                        <PlayRing />
                      </div>
                      <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{r.name}</p>
                      <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">
                        {r.listening > 0 ? `${r.listening} listening` : "Live now"}{r.by ? ` · by ${r.by}` : " · Join"}
                      </p>
                    </Link>
                  );
                })}
              </Shelf>
            </Section>
          );
        }
        if (s.kind === "tracks" && s.tracks?.length) {
          // Newest songs uploaded by Brisic artists.
          const list = s.tracks;
          return (
            <Section key={s.id} title={s.title}>
              <Shelf>{list.map((t, i) => <TrackCard key={t.id} tracks={list} index={i} />)}</Shelf>
            </Section>
          );
        }
        if (s.kind === "spotlight") {
          return (
            <Section key={s.id} title={s.title} href="/spotlight">
              <Shelf>
                {spotArtists.map((item, i) => {
                  const [from, to] = SPOTLIGHT_ART[i % SPOTLIGHT_ART.length];
                  const [first, ...rest] = item.artistName.toUpperCase().split(" ");
                  return (
                    <Link key={item.id} href={`/spotlight/${item.id}`} className="group block w-[160px] shrink-0 sm:w-[176px] lg:w-auto">
                      <div className="poster relative transition group-hover:-translate-y-0.5">
                        <ArtCover art={{ from, to, label: [first, rest.join(" ")].filter(Boolean).join("\n"), figure: "person", px: 92, pfill: "#050505" }} />
                        <PlayRing />
                      </div>
                      <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{item.artistName}</p>
                      <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">{item.isLive ? "LIVE now" : item.title}</p>
                    </Link>
                  );
                })}
              </Shelf>
            </Section>
          );
        }
        const large = s.kind === "large";
        return (
          <Section key={s.id} title={s.title} href={s.kind === "podcasts" ? "/shows" : `/see-all/${s.id}`}>
            <Shelf wide={large}>{s.playlists.map((p) => <PlaylistCard key={p.id} p={p} large={large} />)}</Shelf>
          </Section>
        );
      })}
    </>
  );
}
