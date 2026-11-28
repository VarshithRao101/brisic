"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addSongToPlaylist, adminFindSongs, adminRemoveContent, createEditorialPlaylist, createFeaturedParty, deleteEditorialPlaylist,
  endFeaturedParty, moveEditorialPlaylist, moveSongInPlaylist, removeSongFromPlaylist, updateEditorialPlaylist,
} from "@/app/admin-actions";
import { useToast } from "@/components/app-state";
import { Icon } from "@/components/icons";
import { fmtTime } from "@/lib/format";

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string };

function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<Res<T>>, done?: string): Promise<Res<T> | null> => {
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) { if (done) toast(done); router.refresh(); } else toast(r.error);
      return r;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

const label = "mb-1.5 block text-[13px] font-medium text-ink/85";
function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="mb-3 block"><span className={label}>{title}</span>{children}</label>;
}
const iconBtn = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-transparent text-ink hover:border-primary/60 disabled:opacity-40";

// ---------- Playlists ----------

type Choices = { shelves: string[]; colors: { name: string; from: string; to: string }[]; art: { id: string; thumb: string }[] };
type PlaylistValues = { title: string; subtitle: string; shelf: string; color: string; hero: string };

/** Create or edit a Brisic playlist: name, Home shelf, card colour and page artwork. */
export function PlaylistForm({ choices, initial, id }: { choices: Choices; initial?: PlaylistValues; id?: string }) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [v, setV] = useState<PlaylistValues>(initial ?? { title: "", subtitle: "", shelf: choices.shelves[0], color: choices.colors[0].name, hero: choices.art[0].id });
  const [custom, setCustom] = useState(!!initial && !choices.shelves.includes(initial.shelf));
  const set = (k: keyof PlaylistValues) => (e: { target: { value: string } }) => setV((x) => ({ ...x, [k]: e.target.value }));
  const color = choices.colors.find((c) => c.name === v.color) ?? choices.colors[0];

  return (
    <form
      className="panel p-4 sm:p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (id) { await run(() => updateEditorialPlaylist(id, v), "Playlist saved"); return; }
        const r = await run(() => createEditorialPlaylist(v), "Playlist created. Now add songs.");
        if (r?.ok) router.push(`/admin/playlists/${r.id}`);
      }}
    >
      <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">{id ? "Playlist details" : "New Brisic playlist"}</h2>
      {!id && <p className="m-0 mb-4 text-[13px] font-light text-muted">It shows on Home in the shelf you pick, once it has at least one song.</p>}
      <Field title="Name"><input className="field" required maxLength={60} value={v.title} onChange={set("title")} placeholder="e.g. Afro Hits" /></Field>
      <Field title="Short description (optional)"><input className="field" maxLength={80} value={v.subtitle} onChange={set("subtitle")} placeholder="e.g. The biggest songs this week" /></Field>
      <Field title="Home shelf">
        {custom ? (
          <input className="field" required maxLength={40} value={v.shelf} onChange={set("shelf")} placeholder="Your own shelf name" />
        ) : (
          <select className="field" value={v.shelf} onChange={set("shelf")}>
            {choices.shelves.map((s) => <option key={s} value={s} className="bg-[#0b0f0d]">{s}</option>)}
          </select>
        )}
        <button type="button" className="mt-1.5 border-0 bg-transparent p-0 text-[13px] text-primary" onClick={() => { setCustom((c) => !c); setV((x) => ({ ...x, shelf: custom ? choices.shelves[0] : "" })); }}>
          {custom ? "Pick a standard shelf" : "Or make a new shelf"}
        </button>
      </Field>
      <span className={label}>Card colour</span>
      <div className="mb-3 flex flex-wrap gap-2">
        {choices.colors.map((c) => (
          <button
            key={c.name} type="button" aria-label={c.name} aria-pressed={v.color === c.name} onClick={() => setV((x) => ({ ...x, color: c.name }))}
            className={`h-9 w-9 rounded-full border-2 ${v.color === c.name ? "border-white" : "border-transparent"}`}
            style={{ background: `linear-gradient(150deg, ${c.from}, ${c.to})` }}
          />
        ))}
      </div>
      <span className={label}>Playlist page artwork</span>
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
        {choices.art.map((a) => (
          <button
            key={a.id} type="button" aria-label={`Artwork ${a.id}`} aria-pressed={v.hero === a.id} onClick={() => setV((x) => ({ ...x, hero: a.id }))}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 p-0 ${v.hero === a.id ? "border-primary" : "border-transparent"}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.thumb} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-20 w-20 shrink-0 items-start rounded-xl p-2 font-[family-name:var(--font-bebas)] text-[18px] leading-none text-white" style={{ background: `linear-gradient(150deg, ${color.from}, ${color.to})` }}>
          {(v.title || "Playlist").toUpperCase()}
        </span>
        <span className="text-[13px] font-light text-muted">Preview of the Home card.</span>
      </div>
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : id ? "Save changes" : "Create playlist"}</button>
    </form>
  );
}

export function PlaylistRowActions({ id, title, first, last }: { id: string; title: string; first: boolean; last: boolean }) {
  const { busy, run } = useAction();
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      <button type="button" aria-label="Move left in shelf" className={iconBtn} disabled={busy || first} onClick={() => run(() => moveEditorialPlaylist(id, -1))}><Icon name="back" size={16} /></button>
      <button type="button" aria-label="Move right in shelf" className={iconBtn} disabled={busy || last} onClick={() => run(() => moveEditorialPlaylist(id, 1))}><Icon name="chevron" size={16} /></button>
      <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Delete the playlist "${title}"? The songs stay on Brisic.`)) void run(() => deleteEditorialPlaylist(id), "Playlist deleted"); }}>Delete</button>
    </span>
  );
}

type SongPick = { id: string; title: string; artistName: string; durationSec: number; plays: number };

/** Songs in a Brisic playlist: search Brisic's songs to add, reorder and remove. */
export function PlaylistSongs({ playlistId, songs }: { playlistId: string; songs: SongPick[] }) {
  const { busy, run } = useAction();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<SongPick[]>([]);
  const inList = new Set(songs.map((s) => s.id));

  useEffect(() => {
    let stale = false;
    const t = setTimeout(async () => {
      const r = await adminFindSongs(q).catch(() => []);
      if (!stale) setFound(r);
    }, 250);
    return () => { stale = true; clearTimeout(t); };
  }, [q, songs.length]);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="panel p-4">
        <h2 className="m-0 mb-3 text-[17px] font-semibold text-white">Songs in this playlist ({songs.length})</h2>
        {!songs.length && <p className="m-0 text-[14px] font-light text-muted">Empty. Add songs from the list. The playlist appears on Home once it has a song.</p>}
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {songs.map((s, i) => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
              <span className="w-5 shrink-0 text-center text-[13px] text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] text-white">{s.title}</span>
                <span className="block truncate text-[12px] text-muted">{s.artistName} · {fmtTime(s.durationSec)}</span>
              </span>
              <button type="button" aria-label="Move up" className={iconBtn} disabled={busy || i === 0} onClick={() => run(() => moveSongInPlaylist(playlistId, s.id, -1))}><Icon name="back" size={15} className="rotate-90" /></button>
              <button type="button" aria-label="Move down" className={iconBtn} disabled={busy || i === songs.length - 1} onClick={() => run(() => moveSongInPlaylist(playlistId, s.id, 1))}><Icon name="back" size={15} className="-rotate-90" /></button>
              <button type="button" aria-label={`Remove ${s.title}`} className={iconBtn} disabled={busy} onClick={() => run(() => removeSongFromPlaylist(playlistId, s.id))}><Icon name="x" size={15} /></button>
            </li>
          ))}
        </ol>
      </section>
      <section className="panel p-4">
        <h2 className="m-0 mb-3 text-[17px] font-semibold text-white">Add songs</h2>
        <input className="field mb-3" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Brisic songs or artists" aria-label="Search songs" />
        {!found.length && <p className="m-0 text-[14px] font-light text-muted">{q ? "No songs match." : "No songs on Brisic yet. Artists upload them in their Creator Studio."}</p>}
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {found.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl border border-line px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] text-white">{s.title}</span>
                <span className="block truncate text-[12px] text-muted">{s.artistName} · {s.plays.toLocaleString("en-US")} plays</span>
              </span>
              <button type="button" className="btn btn-sm" disabled={busy || inList.has(s.id)} onClick={() => run(() => addSongToPlaylist(playlistId, s.id))}>
                {inList.has(s.id) ? "Added" : "Add"}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------- Featured parties ----------

export function FeaturedParties({ rooms }: { rooms: { code: string; name: string; listening: number }[] }) {
  const { busy, run } = useAction();
  const [name, setName] = useState("");
  return (
    <>
      <form className="panel p-4 sm:p-5" onSubmit={async (e) => { e.preventDefault(); const r = await run(() => createFeaturedParty(name), "Party is live on Home"); if (r?.ok) setName(""); }}>
        <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">Start a featured party</h2>
        <p className="m-0 mb-4 text-[13px] font-light text-muted">Shows on Home under “Join a Party”. Anyone can join, add songs, vote and chat. It stays open until you end it.</p>
        <Field title="Party name"><input className="field" required maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Friday Night Vibes" /></Field>
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Starting…" : "Start party"}</button>
      </form>
      <h2 className="m-0 mb-2 mt-6 text-[17px] font-semibold text-white">Live featured parties ({rooms.length})</h2>
      {!rooms.length && <p className="m-0 text-[14px] font-light text-muted">None yet.</p>}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {rooms.map((r) => (
          <li key={r.code} className="panel flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-white">{r.name}</span>
              <span className="block text-[12.5px] font-light text-muted">{r.code} · {r.listening} listening now</span>
            </span>
            <Link href={`/party/${r.code}`} className="btn btn-sm">Open</Link>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`End "${r.name}"? Everyone in it is told the party ended.`)) void run(() => endFeaturedParty(r.code), "Party ended"); }}>End</button>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------- Moderation ----------

export function RemoveContentButton({ kind, id, title }: { kind: "song" | "video" | "episode" | "exclusive" | "merch"; id: string; title: string }) {
  const { busy, run } = useAction();
  return (
    <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Take "${title}" off Brisic? This deletes it and can't be undone.`)) void run(() => adminRemoveContent(kind, id), "Removed"); }}>
      Remove
    </button>
  );
}
