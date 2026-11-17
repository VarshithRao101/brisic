import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton, ShareButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { Hero, Section } from "@/components/ui";

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  await getUserId();
  const { id } = await params;
  const data = await catalog.getShow(id);
  if (!data) notFound();
  const { show, episodes } = data;
  const latest = episodes[episodes.length - 1];

  return (
    <>
      <BackButton />
      <Hero cover={<Cover seed={show.id} label={show.title} textSize="text-2xl" />} kind="Podcast" title={show.title} meta={`Hosted by ${show.host} · ${show.episodeCount} episodes`}>
        {latest && <Link href={`/watch/${latest.id}`} className="btn btn-primary"><Icon name="play" size={18} /> Latest episode</Link>}
        <ShareButton title={show.title} />
      </Hero>

      <Section title="All episodes">
        <ol className="m-0 list-none p-0">
          {[...episodes].reverse().map((e) => (
            <li key={e.id}>
              <Link href={`/watch/${e.id}`} className="flex items-center gap-3.5 rounded-2xl px-2 py-3 hover:bg-white/5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-primary"><Icon name="play" size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] font-medium text-white">Ep. {e.number} · {e.title}</span>
                  <span className="block truncate text-[13px] font-light text-muted">{e.minutes} min</span>
                </span>
                <Icon name="chevron" size={18} className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="About">
        <p className="m-0 max-w-2xl text-[15px] font-light leading-relaxed text-ink/90">{show.about}</p>
      </Section>
    </>
  );
}
