import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { Section } from "@/components/ui";

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const data = await catalog.getEpisode(id);
  if (!data) notFound();
  const { episode, show, more } = data;

  return (
    <div className="mx-auto max-w-4xl">
      <BackButton />
      {episode.mediaUrl ? (
        <video src={episode.mediaUrl} controls playsInline className="aspect-video w-full rounded-2xl bg-black" />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-line bg-[linear-gradient(135deg,#12201a,#050a07)] px-6 text-center">
          <Icon name="video" size={40} className="text-muted" />
          <p className="m-0 text-[15.5px] font-medium text-white">This episode is not available to play yet</p>
          <p className="m-0 max-w-sm text-[13px] font-light text-muted">Video and audio for podcasts appear once the media source is connected.</p>
        </div>
      )}

      <p className="m-0 mt-5 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">{show.title} · Ep. {episode.number}</p>
      <h1 className="m-0 mt-1 text-[26px] font-semibold text-white sm:text-[30px]">{episode.title}</h1>
      <p className="m-0 mt-1 text-[14px] font-light text-muted">{episode.minutes} min · Hosted by {show.host}</p>
      <p className="m-0 mt-3 max-w-2xl text-[15px] font-light leading-relaxed text-ink/90">{episode.description}</p>
      <Link href={`/shows/${show.id}`} className="btn mt-4">View show</Link>

      {more.length > 0 && (
        <Section title="More episodes">
          <ul className="m-0 list-none p-0">
            {more.map((e) => (
              <li key={e.id}>
                <Link href={`/watch/${e.id}`} className="flex items-center gap-3.5 rounded-2xl px-2 py-3 hover:bg-white/5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary"><Icon name="play" size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-white">Ep. {e.number} · {e.title}</span>
                    <span className="block text-[13px] font-light text-muted">{e.minutes} min</span>
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
