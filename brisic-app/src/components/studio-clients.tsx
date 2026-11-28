"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addEpisode, addExclusive, addMerch, addVideo, adminGrantCreator, adminRevokeCreator, createShow, deleteEpisode, deleteExclusive, deleteMerch,
  deleteSong, deleteVideo, endEpisodeLive, endLive, publishSong, startUpload, startYouTubeVideo, updateArtistProfile, updateSong,
} from "@/app/studio-actions";
import { useToast } from "@/components/app-state";
import { Icon } from "@/components/icons";
import { fmtTime } from "@/lib/format";

type Res<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** PUTs a file to a signed URL with upload progress. */
function putFile(url: string, file: File, headers: Record<string, string>, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
}

/** Uploads one file to Brisic storage and returns its key. */
async function uploadToStorage(file: File, kind: "audio" | "image", scope: "song" | "cover" | "artist" | "episode" | "exclusive" | "merch", onProgress: (p: number) => void, showId?: string) {
  const ticket = await startUpload({ kind, scope, contentType: file.type, size: file.size, showId });
  if (!ticket.ok) throw new Error(ticket.error);
  await putFile(ticket.url, file, ticket.headers, onProgress);
  return ticket.key;
}

/** Reads an audio file's length in seconds, in the browser. */
function audioDuration(file: File) {
  return new Promise<number>((resolve) => {
    const a = document.createElement("audio");
    const url = URL.createObjectURL(file);
    a.preload = "metadata";
    a.onloadedmetadata = () => { resolve(isFinite(a.duration) ? Math.round(a.duration) : 0); URL.revokeObjectURL(url); };
    a.onerror = () => { resolve(0); URL.revokeObjectURL(url); };
    a.src = url;
  });
}

const label = "mb-1.5 block text-[13px] font-medium text-ink/85";
const card = "panel p-4 sm:p-5";

function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="mb-3 block"><span className={label}>{title}</span>{children}</label>;
}
function Progress({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
function FilePick({ accept, file, onPick, hint }: { accept: string; file: File | null; onPick: (f: File | null) => void; hint: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-line px-4 py-3 hover:border-primary/60">
      <Icon name="plus" size={18} className="shrink-0 text-primary" />
      <span className="min-w-0 flex-1 text-[14px]">
        <span className="block truncate text-ink">{file ? file.name : hint}</span>
        {file && <span className="block text-[12px] text-muted">{(file.size / 1048576).toFixed(1)} MB</span>}
      </span>
      <input type="file" accept={accept} className="sr-only" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </label>
  );
}

function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<Res>, done?: string) => {
    setBusy(true);
    try {
      const r = await fn();
      if (r.ok) { if (done) toast(done); router.refresh(); return true; }
      toast(r.error);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
    return false;
  };
  return { busy, run, toast };
}

// ---------- Admin ----------

export function AdminCreators({ creators, genres }: { creators: { id: string; name: string; email: string; role: string; artistId: string | null; stats: string }[]; genres: string[] }) {
  const { busy, run } = useAction();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"artist" | "podcaster">("artist");
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("Afrobeats");
  return (
    <>
      <form
        className={card}
        onSubmit={async (e) => {
          e.preventDefault();
          if (await run(() => adminGrantCreator({ email, role, name, genre }), "Creator invited")) { setEmail(""); setName(""); }
        }}
      >
        <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">Invite a creator</h2>
        <p className="m-0 mb-4 text-[13px] font-light text-muted">They sign up on Brisic first (Google or email). Then enter their email here to open the Creator Studio for them.</p>
        <Field title="Their Brisic account email"><input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="artist@example.com" /></Field>
        <div className="mb-3 grid grid-cols-2 gap-2">
          {(["artist", "podcaster"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={role === r} onClick={() => setRole(r)} className="chip h-10 justify-center capitalize">{r}</button>
          ))}
        </div>
        <Field title={role === "artist" ? "Artist name (shown to fans)" : "Host name (optional)"}><input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder={role === "artist" ? "e.g. Ama Joy" : ""} /></Field>
        {role === "artist" && <Field title="Main genre"><GenreSelect genres={genres} value={genre} onChange={setGenre} /></Field>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Saving…" : "Invite as " + role}</button>
      </form>

      <h2 className="m-0 mb-2 mt-6 text-[17px] font-semibold text-white">Creators ({creators.length})</h2>
      {creators.length === 0 ? <p className="m-0 text-[14px] font-light text-muted">No creators yet.</p> : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {creators.map((c) => (
            <li key={c.id} className="panel flex items-center gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-white">{c.name} <span className="text-[12px] capitalize text-primary">· {c.role}</span></span>
                <span className="block truncate text-[12.5px] font-light text-muted">{c.email} · {c.stats}</span>
              </span>
              {c.artistId && <Link href={`/artist/${c.artistId}`} className="btn btn-sm">Page</Link>}
              <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Remove ${c.name}'s creator access? Their uploads stay up.`)) void run(() => adminRevokeCreator(c.id), "Access removed"); }}>Remove</button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Genre picker: genre pages and radio stations group artists by this. */
export function GenreSelect({ genres, value, onChange }: { genres: string[]; value: string; onChange: (v: string) => void }) {
  const list = genres.includes(value) ? genres : [value, ...genres];
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {list.map((g) => <option key={g} value={g} className="bg-[#0b0f0d]">{g}</option>)}
    </select>
  );
}

// ---------- Artist studio ----------

export function ArtistProfileForm({ artist, genres }: { artist: { id: string; name: string; genre: string; bio: string; image: string | null }; genres: string[] }) {
  const { busy, run } = useAction();
  const [name, setName] = useState(artist.name);
  const [genre, setGenre] = useState(artist.genre);
  const [bio, setBio] = useState(artist.bio);
  const [photo, setPhoto] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  return (
    <form
      className={card}
      onSubmit={async (e) => {
        e.preventDefault();
        await run(async () => {
          let imageKey: string | null = null;
          if (photo) { setPct(0); imageKey = await uploadToStorage(photo, "image", "artist", setPct); }
          const r = await updateArtistProfile({ name, genre, bio, imageKey });
          setPct(null); if (r.ok) setPhoto(null);
          return r;
        }, "Profile saved");
      }}
    >
      <h2 className="m-0 mb-4 text-[18px] font-semibold text-white">Your artist page</h2>
      <Field title="Artist name"><input className="field" required value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></Field>
      <Field title="Main genre"><GenreSelect genres={genres} value={genre} onChange={setGenre} /></Field>
      <Field title="Bio"><textarea className="field !h-24 !rounded-2xl !py-3" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={800} placeholder="Tell fans who you are." /></Field>
      <span className={label}>Photo {artist.image && <span className="font-light text-muted">(you have one; pick a new file to replace it)</span>}</span>
      <FilePick accept="image/jpeg,image/png,image/webp" file={photo} onPick={setPhoto} hint="Choose a square photo (JPG, PNG or WebP)" />
      <Progress pct={pct} />
      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : "Save profile"}</button>
        <Link href={`/artist/${artist.id}`} className="btn">View page</Link>
      </div>
    </form>
  );
}

export function SongUploadForm() {
  const { busy, run } = useAction();
  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("");
  const [explicit, setExplicit] = useState(false);
  const [lyrics, setLyrics] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [stage, setStage] = useState("");
  return (
    <form
      className={card}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!audio) return;
        const ok = await run(async () => {
          setStage("Reading the song…");
          const durationSec = await audioDuration(audio);
          if (!durationSec) return { ok: false as const, error: "Couldn't read that audio file. Try an MP3 or M4A." };
          let coverKey: string | null = null;
          if (cover) { setStage("Uploading cover…"); setPct(0); coverKey = await uploadToStorage(cover, "image", "cover", setPct); }
          setStage("Uploading song…"); setPct(0);
          const audioKey = await uploadToStorage(audio, "audio", "song", setPct);
          setStage("Publishing…");
          return publishSong({ title, albumTitle: album, explicit, durationSec, audioKey, audioType: audio.type, coverKey, lyrics });
        }, "Song published");
        setStage(""); setPct(null);
        if (ok) { setTitle(""); setAlbum(""); setAudio(null); setCover(null); setExplicit(false); setLyrics(""); }
      }}
    >
      <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">Upload a song</h2>
      <p className="m-0 mb-4 text-[13px] font-light text-muted">Only upload music you own the rights to. It goes live on Brisic right away.</p>
      <Field title="Song title"><input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></Field>
      <Field title="Album or EP (optional)"><input className="field" value={album} onChange={(e) => setAlbum(e.target.value)} maxLength={100} placeholder="Leave empty for a single. Same name = same album." /></Field>
      <span className={label}>Audio file</span>
      <FilePick accept="audio/*" file={audio} onPick={setAudio} hint="Choose the song (MP3, M4A, WAV, up to 80 MB)" />
      <span className={`${label} mt-3`}>Cover art (optional)</span>
      <FilePick accept="image/jpeg,image/png,image/webp" file={cover} onPick={setCover} hint="Square image, JPG/PNG/WebP" />
      <label className="mt-3 block"><span className={label}>Lyrics (optional)</span>
        <textarea className="field !h-28 !rounded-2xl !py-3" value={lyrics} onChange={(e) => setLyrics(e.target.value)} maxLength={8000} placeholder={"[Verse 1]\nFirst line…\n\n[Chorus]\n…"} />
      </label>
      <label className="mt-3 flex items-center gap-2 text-[14px] text-ink">
        <input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /> Explicit lyrics
      </label>
      {stage && <p className="m-0 mt-3 text-[13px] text-accent">{stage}</p>}
      <Progress pct={pct} />
      <button className="btn btn-primary mt-4 w-full" disabled={busy || !audio}>{busy ? "Working…" : "Publish song"}</button>
    </form>
  );
}

type MySong = { id: string; title: string; albumTitle: string | null; explicit: boolean; lyrics: string | null; durationSec: number; plays: number };

function SongEditor({ song, onDone }: { song: MySong; onDone: () => void }) {
  const { busy, run } = useAction();
  const [title, setTitle] = useState(song.title);
  const [album, setAlbum] = useState(song.albumTitle ?? "");
  const [explicit, setExplicit] = useState(song.explicit);
  const [lyrics, setLyrics] = useState(song.lyrics ?? "");
  return (
    <form className="mt-2 border-t border-line pt-3" onSubmit={async (e) => { e.preventDefault(); if (await run(() => updateSong({ id: song.id, title, albumTitle: album, explicit, lyrics }), "Song updated")) onDone(); }}>
      <Field title="Title"><input className="field" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field title="Album or EP"><input className="field" maxLength={100} value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Empty = single" /></Field>
      <Field title="Lyrics"><textarea className="field !h-32 !rounded-2xl !py-3" maxLength={8000} value={lyrics} onChange={(e) => setLyrics(e.target.value)} /></Field>
      <label className="mb-3 flex items-center gap-2 text-[14px] text-ink"><input type="checkbox" checked={explicit} onChange={(e) => setExplicit(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /> Explicit lyrics</label>
      <div className="flex gap-2"><button className="btn btn-primary btn-sm flex-1" disabled={busy}>{busy ? "Saving…" : "Save"}</button><button type="button" className="btn btn-sm" onClick={onDone}>Cancel</button></div>
    </form>
  );
}

export function SongList({ songs }: { songs: MySong[] }) {
  const { busy, run } = useAction();
  const [editing, setEditing] = useState<string | null>(null);
  if (!songs.length) return <p className="m-0 text-[14px] font-light text-muted">No songs yet. Upload your first one above.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {songs.map((s) => (
        <li key={s.id} className="panel px-4 py-2.5">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[15px] text-white">{s.title}{s.explicit && <span className="ml-1.5 rounded-[3px] bg-[#7a6ae0] px-1 text-[10px] font-bold text-white">E</span>}</span>
              <span className="block truncate text-[12.5px] font-light text-muted">{s.albumTitle ? `${s.albumTitle} · ` : "Single · "}{fmtTime(s.durationSec)} · {s.plays.toLocaleString("en-US")} plays{s.lyrics ? " · lyrics" : ""}</span>
            </span>
            <button type="button" className="btn btn-sm" onClick={() => setEditing(editing === s.id ? null : s.id)}>Edit</button>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Delete "${s.title}" from Brisic? This can't be undone.`)) void run(() => deleteSong(s.id), "Song deleted"); }}>Delete</button>
          </div>
          {editing === s.id && <SongEditor song={s} onDone={() => setEditing(null)} />}
        </li>
      ))}
    </ul>
  );
}

/** Add an Artist Spotlight video or go live, by YouTube link (or direct upload when enabled). */
export function VideoForm({ uploadEnabled }: { uploadEnabled: boolean }) {
  const { busy, run, toast } = useAction();
  const [mode, setMode] = useState<"link" | "live" | "upload">("link");
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Video");
  const [blurb, setBlurb] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);

  const submit = async () => {
    if (mode === "upload") {
      if (!file) return;
      return run(async () => {
        const s = await startYouTubeVideo({ title, description: blurb, size: file.size, contentType: file.type });
        if (!s.ok) return s;
        setPct(0);
        const body = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", s.session);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (e) => { if (e.lengthComputable) setPct(Math.round((e.loaded / e.total) * 100)); };
          xhr.onload = () => (xhr.status < 300 ? resolve(xhr.responseText) : reject(new Error("YouTube upload failed")));
          xhr.onerror = () => reject(new Error("YouTube upload failed. Check your connection."));
          xhr.send(file);
        });
        const id = (JSON.parse(body) as { id?: string }).id;
        setPct(null);
        if (!id) return { ok: false as const, error: "YouTube didn't return the video. Try again." };
        return addVideo({ link: id, title, kind, blurb, live: false });
      }, "Video uploaded (unlisted) and added to Spotlight");
    }
    return run(() => addVideo({ link, title, kind, blurb, live: mode === "live" }), mode === "live" ? "You're live on Brisic" : "Video added to Spotlight");
  };

  return (
    <form className={card} onSubmit={async (e) => { e.preventDefault(); if (await submit()) { setLink(""); setTitle(""); setBlurb(""); setFile(null); } }}>
      <h2 className="m-0 mb-3 text-[18px] font-semibold text-white">Artist Spotlight</h2>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button type="button" aria-pressed={mode === "link"} onClick={() => setMode("link")} className="chip h-10 justify-center">YouTube link</button>
        <button type="button" aria-pressed={mode === "live"} onClick={() => setMode("live")} className="chip h-10 justify-center"><span className="h-2 w-2 rounded-full bg-[#ff4a4a]" />Go live</button>
        <button type="button" aria-pressed={mode === "upload"} onClick={() => (uploadEnabled ? setMode("upload") : toast("Direct upload opens once Brisic's YouTube channel is connected. Paste a link for now."))} className="chip h-10 justify-center">Upload file</button>
      </div>
      {mode === "upload" ? (
        <>
          <FilePick accept="video/*" file={file} onPick={setFile} hint="Choose a video file" />
          <p className="m-0 mt-2 text-[12px] font-light text-muted">It uploads to Brisic&apos;s YouTube channel as unlisted, so it only plays inside Brisic.</p>
        </>
      ) : (
        <Field title={mode === "live" ? "Your YouTube live link" : "YouTube video link"}>
          <input className="field" required value={link} onChange={(e) => setLink(e.target.value)} placeholder={mode === "live" ? "https://youtube.com/live/…" : "https://youtu.be/…"} />
        </Field>
      )}
      {mode === "live" && <p className="m-0 -mt-1 mb-3 text-[12px] font-light text-muted">Start the stream on YouTube (set it to Unlisted), then paste its link. Fans see you as LIVE at the top of Spotlight until you end it here.</p>}
      <Field title="Title"><input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder={mode === "live" ? "Live from the studio" : "Exclusive Performance"} /></Field>
      {mode !== "live" && (
        <div className="mb-3 grid grid-cols-3 gap-2">
          {["Video", "Interview", "Audio"].map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className="chip h-9 justify-center">{k === "Video" ? "Performance" : k === "Audio" ? "Session" : k}</button>)}
        </div>
      )}
      <Field title="Description (optional)"><textarea className="field !h-20 !rounded-2xl !py-3" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={600} /></Field>
      <Progress pct={pct} />
      <button className="btn btn-primary mt-2 w-full" disabled={busy}>{busy ? "Working…" : mode === "live" ? "Go live on Brisic" : mode === "upload" ? "Upload to Spotlight" : "Add to Spotlight"}</button>
    </form>
  );
}

export function VideoList({ videos }: { videos: { id: string; title: string; kind: string; isLive: boolean; views: number }[] }) {
  const { busy, run } = useAction();
  if (!videos.length) return <p className="m-0 text-[14px] font-light text-muted">No videos yet.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {videos.map((v) => (
        <li key={v.id} className="panel flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
          <span className="min-w-[60%] flex-1">
            <span className="flex items-center gap-2 truncate text-[15px] text-white">
              {v.isLive && <span className="rounded bg-[#e02a2a] px-1.5 text-[10px] font-bold text-white">LIVE</span>}
              <span className="truncate">{v.title}</span>
            </span>
            <span className="block text-[12.5px] font-light text-muted">{v.kind} · {v.views.toLocaleString("en-US")} views</span>
          </span>
          <Link href={`/spotlight/v-${v.id}`} className="btn btn-sm">Open</Link>
          {v.isLive && <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void run(() => endLive(v.id), "Live ended")}>End live</button>}
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Remove "${v.title}" from Spotlight?`)) void run(() => deleteVideo(v.id), "Removed"); }}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

// ---------- Podcaster studio ----------

const SHOW_COLORS: [string, string][] = [["#7a2a8a", "#2a0f45"], ["#d6841a", "#5a2a08"], ["#1c6be0", "#0a2a7a"], ["#2f8a3a", "#0c3a1a"], ["#c0309a", "#4a0f55"], ["#e02a2a", "#6a0a0a"]];

export function NewShowForm() {
  const { busy, run } = useAction();
  const [title, setTitle] = useState("");
  const [blurb, setBlurb] = useState("");
  const [about, setAbout] = useState("");
  const [color, setColor] = useState(0);
  return (
    <form className={card} onSubmit={async (e) => { e.preventDefault(); const [a, b] = SHOW_COLORS[color]; if (await run(() => createShow({ title, blurb, about, colorFrom: a, colorTo: b }), "Show created")) { setTitle(""); setBlurb(""); setAbout(""); } }}>
      <h2 className="m-0 mb-4 text-[18px] font-semibold text-white">Create a show</h2>
      <Field title="Show name"><input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} /></Field>
      <Field title="One-line description"><input className="field" value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={120} placeholder="Stories behind the music" /></Field>
      <Field title="About the show"><textarea className="field !h-20 !rounded-2xl !py-3" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={1200} /></Field>
      <span className={label}>Show colour</span>
      <div className="mb-4 flex gap-2">
        {SHOW_COLORS.map(([a, b], i) => (
          <button key={a} type="button" aria-label={`Colour ${i + 1}`} aria-pressed={color === i} onClick={() => setColor(i)} className={`h-9 w-9 rounded-full ${color === i ? "outline outline-[3px] outline-offset-2 outline-white" : ""}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} />
        ))}
      </div>
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Creating…" : "Create show"}</button>
    </form>
  );
}

export function EpisodeForm({ showId }: { showId: string }) {
  const { busy, run } = useAction();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("");
  const [link, setLink] = useState("");
  const [live, setLive] = useState(false);
  const [audio, setAudio] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  return (
    <form
      className="mt-3 rounded-2xl border border-line p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(async () => {
          let audioKey: string | null = null;
          let mins = Number(minutes) || 0;
          if (audio) {
            if (!mins) mins = Math.round((await audioDuration(audio)) / 60);
            setPct(0); audioKey = await uploadToStorage(audio, "audio", "episode", setPct, showId);
          }
          const r = await addEpisode({ showId, title, description, minutes: mins, link: link || undefined, audioKey, audioType: audio?.type ?? null, live });
          setPct(null);
          return r;
        }, live ? "You're live on Brisic" : "Episode published");
        if (ok) { setTitle(""); setDescription(""); setMinutes(""); setLink(""); setAudio(null); setLive(false); }
      }}
    >
      <p className="m-0 mb-3 text-[15px] font-semibold text-white">New episode</p>
      <Field title="Title"><input className="field" required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></Field>
      <Field title="Description"><textarea className="field !h-20 !rounded-2xl !py-3" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></Field>
      <Field title="YouTube link (video or live)"><input className="field" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/…" /></Field>
      <span className={label}>Audio-only version (optional)</span>
      <FilePick accept="audio/*" file={audio} onPick={setAudio} hint="MP3 or M4A for the Listen player" />
      <Progress pct={pct} />
      <div className="mt-3 flex items-center gap-4">
        <label className="flex items-center gap-2 text-[14px] text-ink"><input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" /> This is a live stream</label>
        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted">Minutes <input className="field !h-9 !w-20 !px-3 !text-[14px]" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} /></label>
      </div>
      <button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? "Working…" : "Publish episode"}</button>
    </form>
  );
}

export function EpisodeList({ episodes }: { episodes: { id: string; number: number; title: string; isLive: boolean; hasVideo: boolean; hasAudio: boolean }[] }) {
  const { busy, run } = useAction();
  if (!episodes.length) return <p className="m-0 mt-2 text-[14px] font-light text-muted">No episodes yet.</p>;
  return (
    <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
      {episodes.map((e) => (
        <li key={e.id} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-[14.5px] text-white">
              {e.isLive && <span className="rounded bg-[#e02a2a] px-1.5 text-[10px] font-bold text-white">LIVE</span>}
              <span className="truncate">Ep. {e.number} · {e.title}</span>
            </span>
            <span className="block text-[12px] font-light text-muted">{[e.hasVideo && "Video", e.hasAudio && "Audio"].filter(Boolean).join(" + ")}</span>
          </span>
          <Link href={e.hasVideo ? `/watch/e-${e.id}` : `/listen/e-${e.id}`} className="btn btn-sm">Open</Link>
          {e.isLive && <button type="button" className="btn btn-sm" disabled={busy} onClick={() => void run(() => endEpisodeLive(e.id), "Live ended")}>End live</button>}
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Delete episode ${e.number}?`)) void run(() => deleteEpisode(e.id), "Episode deleted"); }}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

// ---------- Artists: exclusives and merch ----------

/** Fan-only content for B-Coins: an unlisted YouTube video and/or an audio file. */
export function ExclusiveForm({ storageOn }: { storageOn: boolean }) {
  const { busy, run } = useAction();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("Song");
  const [price, setPrice] = useState("100");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [audio, setAudio] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  return (
    <form
      className={card}
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(async () => {
          let audioKey: string | null = null;
          if (audio) { setPct(0); audioKey = await uploadToStorage(audio, "audio", "exclusive", setPct); }
          return addExclusive({ title, description, kind, price: Number(price), link, audioKey, audioType: audio?.type ?? null });
        }, "Exclusive published. Your followers were told.");
        setPct(null);
        if (ok) { setTitle(""); setDescription(""); setLink(""); setAudio(null); }
      }}
    >
      <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">Add exclusive content</h2>
      <p className="m-0 mb-4 text-[13px] font-light text-muted">Fans unlock it with B-Coins and the coins count toward your earnings. For video, upload to YouTube as <b>Unlisted</b> and paste the link.</p>
      <Field title="Title"><input className="field" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unreleased demo" /></Field>
      <div className="mb-3 grid grid-cols-3 gap-2">
        {["Song", "Video", "Story"].map((k) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className="chip h-10 justify-center">{k}</button>)}
      </div>
      <Field title="Price in B-Coins (1 B-Coin = ₦1)"><input className="field" type="number" min={10} max={100000} required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      <Field title="What fans get"><textarea className="field !h-20 !rounded-2xl !py-3" maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field title="YouTube link (unlisted video)"><input className="field" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtu.be/…" /></Field>
      {storageOn && (
        <>
          <span className={label}>Or an audio file</span>
          <FilePick accept="audio/*" file={audio} onPick={setAudio} hint="MP3, M4A or WAV, up to 80 MB" />
          <Progress pct={pct} />
        </>
      )}
      <button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? "Publishing…" : "Publish exclusive"}</button>
    </form>
  );
}

export function ExclusiveAdminList({ items }: { items: { id: string; title: string; kind: string; price: number; unlocks: number }[] }) {
  const { busy, run } = useAction();
  if (!items.length) return <p className="m-0 text-[14px] font-light text-muted">No exclusives yet.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((x) => (
        <li key={x.id} className="panel flex items-center gap-3 px-4 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-white">{x.title}</span>
            <span className="block text-[12.5px] font-light text-muted">{x.kind} · {x.price} B · {x.unlocks} {x.unlocks === 1 ? "fan" : "fans"} unlocked</span>
          </span>
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Delete "${x.title}"? Fans who unlocked it lose access.`)) void run(() => deleteExclusive(x.id), "Deleted"); }}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

export function MerchForm({ storageOn }: { storageOn: boolean }) {
  const { busy, run } = useAction();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [buyUrl, setBuyUrl] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [pct, setPct] = useState<number | null>(null);
  return (
    <form
      className={card}
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run(async () => {
          let imageKey: string | null = null;
          if (photo) { setPct(0); imageKey = await uploadToStorage(photo, "image", "merch", setPct); }
          return addMerch({ name, priceNaira: Number(price), description, buyUrl, imageKey });
        }, "Item added to your merch page");
        setPct(null);
        if (ok) { setName(""); setPrice(""); setDescription(""); setBuyUrl(""); setPhoto(null); }
      }}
    >
      <h2 className="m-0 mb-1 text-[18px] font-semibold text-white">Add merch</h2>
      <p className="m-0 mb-4 text-[13px] font-light text-muted">Fans see it on your Merch page. “Buy” opens your own store or order link until Brisic checkout ships.</p>
      <Field title="Item name"><input className="field" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tour Tee" /></Field>
      <Field title="Price (₦)"><input className="field" type="number" min={100} required value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
      <Field title="Description (optional)"><input className="field" maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <Field title="Buy link (your store, Instagram or WhatsApp order link)"><input className="field" value={buyUrl} onChange={(e) => setBuyUrl(e.target.value)} placeholder="https://…" /></Field>
      {storageOn && (
        <>
          <span className={label}>Photo</span>
          <FilePick accept="image/jpeg,image/png,image/webp" file={photo} onPick={setPhoto} hint="JPG, PNG or WebP" />
          <Progress pct={pct} />
        </>
      )}
      <button className="btn btn-primary mt-4 w-full" disabled={busy}>{busy ? "Adding…" : "Add item"}</button>
    </form>
  );
}

export function MerchAdminList({ items }: { items: { id: string; name: string; priceNaira: number; buyUrl: string | null }[] }) {
  const { busy, run } = useAction();
  if (!items.length) return <p className="m-0 text-[14px] font-light text-muted">No merch yet.</p>;
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {items.map((m) => (
        <li key={m.id} className="panel flex items-center gap-3 px-4 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] text-white">{m.name}</span>
            <span className="block truncate text-[12.5px] font-light text-muted">₦{m.priceNaira.toLocaleString("en-US")}{m.buyUrl ? ` · ${new URL(m.buyUrl).hostname}` : " · no buy link"}</span>
          </span>
          <button type="button" className="btn btn-sm" disabled={busy} onClick={() => { if (confirm(`Remove "${m.name}"?`)) void run(() => deleteMerch(m.id), "Removed"); }}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
