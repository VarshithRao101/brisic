import Link from "next/link";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import type { SpotlightItem } from "@/lib/catalog/types";
import { fmtCount } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { FeaturedSpotlight, SpotlightPoster, SpotlightTile, spotLength } from "@/components/spotlight";
import { DisplayTitle, Section, Shelf } from "@/components/ui";

const FILTERS: [string, string, SpotlightItem["kind"] | null][] = [
  ["all", "All", null], ["videos", "Videos", "Video"], ["audio", "Audio", "Audio"], ["live", "Live", "Live"], ["interviews", "Interviews", "Interview"],
];

export const metadata = { title: "Artist Spotlight · Brisic" };

export default async function SpotlightPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await getUserId();
  const [sp, items] = await Promise.all([searchParams, catalog.getSpotlight()]);
  const filter = FILTERS.find((f) => f[0] === sp.type) ?? FILTERS[0];
  const shown = filter[2] ? items.filter((i) => i.kind === filter[2]) : items;
  const byArtist = items.filter((s, i, all) => all.findIndex((x) => x.artistId === s.artistId) === i);
  const featured = byArtist.slice(0, 4);
  const live = items.filter((i) => i.kind === "Live");
  const top = [...byArtist].sort((a, b) => b.views - a.views).slice(0, 4);

  return (
    <>
      <div className="flex items-center gap-3">
        <BackButton />
        <DisplayTitle className="mb-3">Artist Spotlight</DisplayTitle>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:overflow-visible lg:px-0">
        {featured.map((f, i) => (
          <div key={f.id} className="snap-center"><FeaturedSpotlight item={f} badge={i === 0 ? "SPOTLIGHT" : "TRENDING"} /></div>
        ))}
      </div>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="display m-0 text-[26px] text-primary">({byArtist.length}) Featured Artists</h2>
          <Link href="/trending" className="rounded-md bg-primary px-2.5 py-1 text-[12px] font-semibold text-primary-ink">View All</Link>
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {byArtist.map((a) => (
            <Link key={a.artistId} href={`/artist/${a.artistId}`} className="relative w-[84px] shrink-0 overflow-hidden rounded-xl border border-white/10">
              <SpotlightPoster seed={a.artistId} youtubeId={a.youtubeId} className="aspect-square w-full" />
              <span className="display absolute inset-x-1 bottom-1 truncate text-[13px] text-primary">{a.artistName.toUpperCase()}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Filter">
        {FILTERS.map(([id, label]) => (
          <Link key={id} href={id === "all" ? "/spotlight" : `/spotlight?type=${id}`} scroll={false} aria-current={filter[0] === id ? "page" : undefined} className="chip">
            {label}
          </Link>
        ))}
      </div>

      <Section title={filter[0] === "all" ? "Trending Artist Videos" : filter[1]}>
        {shown.length === 0 ? (
          <p className="m-0 text-[14px] font-light text-muted">Nothing here yet.</p>
        ) : (
          <Shelf wide>{shown.map((v) => <SpotlightTile key={v.id} item={v} />)}</Shelf>
        )}
      </Section>

      {filter[0] === "all" && live.length > 0 && (
        <Section title="Live Now">
          <Shelf wide>{live.map((v) => <SpotlightTile key={v.id} item={v} />)}</Shelf>
        </Section>
      )}

      {filter[0] === "all" && (
        <>
          <section className="mt-7">
            <h2 className="m-0 mb-3 flex items-center gap-2 text-[18px] font-semibold text-white">
              <Icon name="crown" size={18} className="text-primary" /> Top Artist Spotlight
            </h2>
            <div className="panel-glow grid grid-cols-4 gap-2 p-3">
              {top.map((t, i) => (
                <Link key={t.id} href={`/spotlight/${t.id}`} className="text-center">
                  <span className="relative block overflow-hidden rounded-xl">
                    <SpotlightPoster seed={t.artistId} youtubeId={t.youtubeId} className="aspect-square w-full" />
                    <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-black/70 text-[12px] font-bold text-primary">{i + 1}</span>
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-ink">{t.artistName}</span>
                </Link>
              ))}
            </div>
          </section>

          <Section title="Spotlight You May Love">
            <p className="m-0 -mt-2 mb-3 text-[13px] font-light text-muted">Videos, audio, live sessions and interviews picked for you.</p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {[...items].reverse().slice(0, 6).map((v) => (
                <li key={v.id}>
                  <Link href={`/spotlight/${v.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/5">
                    <span className="relative w-24 shrink-0 overflow-hidden rounded-lg">
                      <SpotlightPoster seed={v.id} youtubeId={v.youtubeId} className="aspect-video w-full" />
                      <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">{spotLength(v)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="inline-block rounded bg-primary px-1.5 text-[10px] font-bold uppercase text-primary-ink">{v.kind}</span>
                      <span className="block truncate text-[14.5px] text-white">{v.title}</span>
                      <span className="block truncate text-[12.5px] font-light text-muted">{v.artistName} · {fmtCount(v.views)} views</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}
