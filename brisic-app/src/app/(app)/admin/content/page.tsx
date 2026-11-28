import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtTime, timeAgo } from "@/lib/format";
import { RemoveContentButton } from "@/components/admin-clients";

const TYPES = ["songs", "videos", "episodes", "exclusives", "merch"] as const;

/** Everything creators have published, newest first, with a way to take anything down. */
export default async function AdminContentPage({ searchParams }: { searchParams: Promise<{ type?: string; q?: string }> }) {
  const sp = await searchParams;
  const type = (TYPES as readonly string[]).includes(sp.type ?? "") ? sp.type! : "songs";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const has = { contains: q, mode: "insensitive" as const };

  let rows: { id: string; title: string; sub: string; href?: string; kind: "song" | "video" | "episode" | "exclusive" | "merch" }[] = [];
  if (type === "songs") {
    const list = await prisma.song.findMany({
      where: q ? { OR: [{ title: has }, { artist: { name: has } }] } : {}, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, title: true, durationSec: true, plays: true, createdAt: true, artist: { select: { id: true, name: true } } },
    });
    rows = list.map((s) => ({ id: s.id, kind: "song", title: s.title, sub: `${s.artist.name} · ${fmtTime(s.durationSec)} · ${s.plays} plays · ${timeAgo(s.createdAt)}`, href: `/artist/${s.artist.id}` }));
  } else if (type === "videos") {
    const list = await prisma.video.findMany({
      where: q ? { OR: [{ title: has }, { artist: { name: has } }] } : {}, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, title: true, isLive: true, views: true, createdAt: true, artist: { select: { name: true } } },
    });
    rows = list.map((v) => ({ id: v.id, kind: "video", title: v.title, sub: `${v.artist.name}${v.isLive ? " · LIVE" : ""} · ${v.views} views · ${timeAgo(v.createdAt)}`, href: `/spotlight/v-${v.id}` }));
  } else if (type === "episodes") {
    const list = await prisma.podcastEpisode.findMany({
      where: q ? { OR: [{ title: has }, { show: { title: has } }] } : {}, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, number: true, title: true, createdAt: true, show: { select: { id: true, title: true } } },
    });
    rows = list.map((e) => ({ id: e.id, kind: "episode", title: e.title, sub: `${e.show.title} · Episode ${e.number} · ${timeAgo(e.createdAt)}`, href: `/shows/${e.show.id}` }));
  } else if (type === "exclusives") {
    const list = await prisma.exclusive.findMany({
      where: q ? { OR: [{ title: has }, { artist: { name: has } }] } : {}, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, title: true, price: true, createdAt: true, artist: { select: { id: true, name: true } } },
    });
    rows = list.map((x) => ({ id: x.id, kind: "exclusive", title: x.title, sub: `${x.artist.name} · ${x.price} B · ${timeAgo(x.createdAt)}`, href: `/artist/${x.artist.id}/exclusive` }));
  } else {
    const list = await prisma.merchItem.findMany({
      where: q ? { OR: [{ name: has }, { artist: { name: has } }] } : {}, orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, name: true, priceNaira: true, createdAt: true, artist: { select: { id: true, name: true } } },
    });
    rows = list.map((m) => ({ id: m.id, kind: "merch", title: m.name, sub: `${m.artist.name} · ₦${m.priceNaira.toLocaleString("en-US")} · ${timeAgo(m.createdAt)}`, href: `/artist/${m.artist.id}/merch` }));
  }

  return (
    <>
      <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TYPES.map((t) => (
          <Link key={t} href={`/admin/content?type=${t}`} aria-current={type === t ? "true" : undefined} className={`chip shrink-0 capitalize ${type === t ? "chip-on" : ""}`}>{t}</Link>
        ))}
      </div>
      <form className="mb-3 flex gap-2">
        <input type="hidden" name="type" value={type} />
        <input name="q" defaultValue={q} className="field" placeholder={`Search ${type}`} aria-label={`Search ${type}`} />
        <button className="btn shrink-0 !h-12">Search</button>
      </form>
      {!rows.length && <p className="panel m-0 p-4 text-[14px] font-light text-muted">{q ? "Nothing matches." : `No ${type} on Brisic yet.`}</p>}
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {rows.map((r) => (
          <li key={r.id} className="panel flex items-center gap-3 px-4 py-2.5">
            {r.href ? (
              <Link href={r.href} className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-white">{r.title}</span>
                <span className="block truncate text-[12.5px] font-light text-muted">{r.sub}</span>
              </Link>
            ) : (
              <span className="min-w-0 flex-1"><span className="block truncate text-[15px] text-white">{r.title}</span></span>
            )}
            <RemoveContentButton kind={r.kind} id={r.id} title={r.title} />
          </li>
        ))}
      </ul>
    </>
  );
}
