import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { SPOTLIGHT_ART } from "@/lib/catalog/home-data";
import { hydrate, uniqueByTrack } from "@/lib/library";
import { homeParties } from "@/lib/party";
import { ArtistBubble, PlayRing, PlaylistCard, Section, Shelf } from "@/components/ui";
import { ArtCover } from "@/components/cover";
import { TrackCard } from "@/components/track-list";

const slug = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default async function HomePage() {
  const userId = await getUserId();
  const [sections, trending, history, spotlight] = await Promise.all([
    catalog.getHomeSections(),
    catalog.getTrendingArtists("week"),
    prisma.playHistory.findMany({ where: { userId }, orderBy: { playedAt: "desc" }, take: 40 }),
    catalog.getSpotlight(),
  ]);
  const partyShelf = sections.find((s) => s.kind === "parties");
  const [recent, parties] = await Promise.all([
    hydrate(uniqueByTrack(history).slice(0, 10)),
    partyShelf ? homeParties(partyShelf.playlists.map((p) => ({ key: slug(p.title), name: p.title }))) : null,
  ]);
  const spotArtists = spotlight.filter((s, i, all) => all.findIndex((x) => x.artistId === s.artistId) === i).slice(0, 8);

  return (
    <>
      <h1 className="sr-only">Listen now</h1>

      <Section title="Trending Artist" href="/trending">
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {trending.slice(0, 12).map((a) => <ArtistBubble key={a.id} a={a} />)}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title="Recently Played" href="/library/history">
          <Shelf>{recent.map((t, i) => <TrackCard key={t.id} tracks={recent} index={i} />)}</Shelf>
        </Section>
      )}

      {sections.map((s) => {
        if (s.kind === "parties" && parties) {
          // Join only: featured rooms that are always open, plus listener parties that are live now.
          return (
            <Section key={s.id} title={s.title} href="/party">
              <Shelf>
                {s.playlists.map((p, i) => {
                  const room = parties.featured[i];
                  if (!room?.code || !p.art) return null;
                  return (
                    <Link key={p.id} href={`/party/${room.code}`} className="group block w-[160px] shrink-0 sm:w-[176px] lg:w-auto">
                      <div className="poster relative transition group-hover:-translate-y-0.5">
                        <ArtCover art={p.art} />
                        <span className="poster-label absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10.5px] font-bold text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#ff4a4a]" /> LIVE
                        </span>
                        <PlayRing />
                      </div>
                      <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{p.title}</p>
                      <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">
                        {room.listening > 0 ? `${room.listening} listening · Join now` : "Live now · Join"}
                      </p>
                    </Link>
                  );
                })}
                {parties.live.map((r) => (
                  <Link key={r.code} href={`/party/${r.code}`} className="group block w-[160px] shrink-0 sm:w-[176px] lg:w-auto">
                    <div className="poster relative transition group-hover:-translate-y-0.5">
                      <ArtCover art={{ from: "#2a8a8a", to: "#0c2a30", label: r.name.toUpperCase().split(" ").slice(0, 2).join("\n") }} />
                      <PlayRing />
                    </div>
                    <p className="m-0 mt-2.5 truncate text-[15px] leading-tight text-ink">{r.name}</p>
                    <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">{r.listening} listening · by {r.hostName}</p>
                  </Link>
                ))}
              </Shelf>
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
                      <p className="m-0 mt-0.5 truncate text-[13px] font-light text-muted">{item.title}</p>
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
