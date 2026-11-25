import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { fmtCount } from "@/lib/format";
import { BackButton, FollowButton, ShareButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { SpotlightPoster, spotLength } from "@/components/spotlight";
import { SpotlightPlayer } from "@/components/spotlight-player";
import { Section } from "@/components/ui";

export default async function SpotlightItemPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getSpotlightItem(id);
  if (!data) notFound();
  const { item, more } = data;

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton />
      <SpotlightPlayer key={item.id} item={item} />

      <span className="mt-4 inline-block rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-ink">{item.kind}</span>
      <div className="mt-1.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 text-[24px] font-bold text-white sm:text-[30px]">{item.title}</h1>
          <p className="m-0 text-[13.5px] font-light text-muted">
            <Link href={`/artist/${item.artistId}`} className="text-ink hover:underline">{item.artistName}</Link> · {fmtCount(item.views)} views
          </p>
        </div>
        <FollowButton artistId={item.artistId} artistName={item.artistName} small />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/artist/${item.artistId}/support`} className="btn btn-primary btn-sm"><Icon name="heart" size={16} fill /> Support Artist</Link>
        <ShareButton title={`${item.title} · ${item.artistName}`} />
      </div>
      <Link href={`/artist/${item.artistId}/gifts`} className="btn btn-outline mt-3 w-full sm:w-auto">
        <Icon name="gift" size={18} /> Send a Gift to {item.artistName}
      </Link>

      <p className="m-0 mt-4 max-w-2xl text-[14.5px] font-light leading-relaxed text-ink/90">{item.blurb}</p>

      {more.length > 0 && (
        <Section title="More from Spotlight" href="/spotlight">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {more.map((v) => (
              <li key={v.id}>
                <Link href={`/spotlight/${v.id}`} className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-white/5">
                  <span className="relative w-28 shrink-0 overflow-hidden rounded-lg">
                    <SpotlightPoster seed={v.id} youtubeId={v.youtubeId} className="aspect-video w-full" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">{spotLength(v)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="inline-block rounded bg-primary px-1.5 text-[10px] font-bold uppercase text-primary-ink">{v.kind}</span>
                    <span className="block truncate text-[15px] text-white">{v.title}</span>
                    <span className="block truncate text-[12.5px] font-light text-muted">{v.artistName} · {fmtCount(v.views)} views</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
