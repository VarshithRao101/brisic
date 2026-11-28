import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PALETTE, PLAYLIST_SHELVES, SHELVES } from "@/lib/catalog/home-data";
import { ART_CHOICES } from "@/lib/playlist-art";
import { PlaylistForm, PlaylistRowActions } from "@/components/admin-clients";

export default async function AdminPlaylistsPage() {
  const rows = await prisma.editorialPlaylist.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, title: true, shelf: true, artFrom: true, artTo: true, _count: { select: { songs: true } } },
  });
  // Group by shelf, in Home order (custom shelves last).
  const order = [...SHELVES.map((s) => s.title), ...new Set(rows.map((r) => r.shelf))];
  const shelves = [...new Set(order)].map((title) => ({ title, list: rows.filter((r) => r.shelf === title) })).filter((s) => s.list.length);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section>
        <h2 className="m-0 mb-1 text-[17px] font-semibold text-white">Home shelves</h2>
        <p className="m-0 mb-3 text-[13px] font-light text-muted">Playlists with no songs stay hidden from listeners. Arrows set the order inside a shelf.</p>
        {!shelves.length && <p className="panel m-0 p-4 text-[14px] font-light text-muted">No Brisic playlists yet. Make the first one.</p>}
        <div className="flex flex-col gap-4">
          {shelves.map((s) => (
            <div key={s.title}>
              <h3 className="m-0 mb-1.5 text-[14px] font-semibold uppercase tracking-wider text-accent">{s.title}</h3>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {s.list.map((p, i) => (
                  <li key={p.id} className="panel flex items-center gap-3 px-3 py-2">
                    <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: `linear-gradient(150deg, ${p.artFrom}, ${p.artTo})` }} />
                    <Link href={`/admin/playlists/${p.id}`} className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-white">{p.title}</span>
                      <span className={`block text-[12.5px] font-light ${p._count.songs ? "text-muted" : "text-[#ffcf87]"}`}>{p._count.songs ? `${p._count.songs} songs` : "No songs: hidden"}</span>
                    </Link>
                    <PlaylistRowActions id={p.id} title={p.title} first={i === 0} last={i === s.list.length - 1} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
      <PlaylistForm choices={{ shelves: PLAYLIST_SHELVES, colors: PALETTE, art: ART_CHOICES }} />
    </div>
  );
}
