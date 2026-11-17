"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/catalog/types";
import type { PartyState } from "@/lib/party";
import {
  addPartySong, createParty, joinParty, leaveParty, partyTracks, searchPartySongs,
  sendPartyMessage, setPartyChat, skipPartySong, votePartySong,
} from "@/app/party-actions";
import { usePlayer, useToast } from "@/components/app-state";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";
import { fmtTime, hashStr } from "@/lib/format";

const BADGE = ["#2f7a34", "#7a2a8a", "#d6841a", "#1c6be0", "#c0309a", "#1f9a9a", "#c8452f"];

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between gap-3 border-0 bg-transparent py-2 text-left text-[14.5px] text-ink">
      {label}
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-primary" : "bg-white/15"}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-6" : "left-1"}`} />
      </span>
    </button>
  );
}

/** Create or join a party. */
export function PartyLobby({ startJoin, defaultName }: { startJoin: boolean; defaultName: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">(startJoin ? "join" : "create");
  const [name, setName] = useState(defaultName);
  const [isPublic, setPublic] = useState(true);
  const [chatOpen, setChat] = useState(true);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const go = async (fn: () => Promise<{ ok: true; code: string } | { ok: false; error: string }>) => {
    setBusy(true); setError("");
    const r = await fn().catch(() => ({ ok: false as const, error: "Something went wrong. Check your connection." }));
    if (r.ok) router.push(`/party/${r.code}`);
    else { setBusy(false); setError(r.error); }
  };

  return (
    <div className="panel-glow overflow-hidden !rounded-[28px]">
      <div className="flex justify-center gap-1 p-3">
        {(["create", "join"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => { setTab(t); setError(""); }} className="chip min-w-[110px] justify-center capitalize">{t}</button>
        ))}
      </div>

      <div className="relative h-40 overflow-hidden sm:h-48" aria-hidden="true">
        <div className="absolute inset-0" style={{ background: "radial-gradient(60% 70% at 70% 20%, rgba(var(--primary-rgb),0.5), transparent 70%), linear-gradient(180deg, #1a1d1c, #050606)" }} />
        <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
          {Array.from({ length: 22 }, (_, i) => {
            const x = 8 + i * 18.5, h = 40 + ((i * 37) % 30), arm = i % 4 === 0;
            return (
              <g key={i} fill="#020202">
                <circle cx={x} cy={160 - h} r="8" />
                <rect x={x - 9} y={166 - h} width="18" height={h} rx="7" />
                {arm && <rect x={x + 3} y={110 - h} width="5" height="50" rx="2.5" transform={`rotate(12 ${x} ${160 - h})`} />}
              </g>
            );
          })}
        </svg>
        <span className="absolute left-4 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[11.5px] font-semibold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {tab === "create" ? "Create" : "Live"}
        </span>
      </div>

      <div className="p-5">
        {tab === "create" ? (
          <form onSubmit={(e) => { e.preventDefault(); void go(() => createParty({ name, isPublic, chatOpen })); }}>
            <h2 className="m-0 flex items-center gap-3 text-[28px] font-bold text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/60 text-primary"><Icon name="plus" size={24} /></span>
              Create a <span className="text-primary">Party</span>
            </h2>
            <p className="m-0 mt-2 text-[14px] font-light text-ink/80">Host your own music gathering, invite people and build community.</p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] text-muted">Party name</span>
              <input className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Friday Night Vibes" />
            </label>
            <div className="mt-2 divide-y divide-white/5">
              <Toggle label={isPublic ? "Public: anyone can find and join" : "Private: only people with the code"} on={isPublic} onChange={setPublic} />
              <Toggle label="Chat open for everyone" on={chatOpen} onChange={setChat} />
            </div>
            {error && <p role="alert" className="m-0 mt-3 text-[14px] text-[#ffb3b3]">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-primary mt-4 w-full !h-[52px] text-[16px]">
              <Icon name="plus" size={18} /> {busy ? "Starting…" : "Create Party"}
            </button>
          </form>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void go(() => joinParty(code)); }}>
            <h2 className="m-0 text-[26px] font-bold text-white">Enter the party code</h2>
            <p className="m-0 mt-1 text-[14px] font-light text-ink/80">Paste the code or link your friend sent you.</p>
            <input className="field mt-4 uppercase tracking-wider" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BRS-7K2Q9 or party link" aria-label="Party code" autoCapitalize="characters" />
            <button
              type="button" className="btn btn-sm mt-3"
              onClick={async () => { try { setCode(await navigator.clipboard.readText()); } catch { setError("Your browser blocked pasting. Type the code instead."); } }}
            >
              Paste from clipboard
            </button>
            {error && <p role="alert" className="m-0 mt-3 text-[14px] text-[#ffb3b3]">{error}</p>}
            <button type="submit" disabled={busy || !code.trim()} className="btn btn-primary mt-4 w-full !h-[52px] text-[16px]">
              <Icon name="users" size={18} /> {busy ? "Joining…" : "Join party"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Initial({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.45, background: BADGE[hashStr(name) % BADGE.length] }}>
      {name[0]?.toUpperCase()}
    </span>
  );
}

const asTrack = (t: { trackId: string; title: string; artistName: string; durationSec?: number }): Track => ({
  id: t.trackId, title: t.title, artistId: "", artistName: t.artistName, durationSec: t.durationSec ?? 200, streams: 0,
});

/** Search sheet for adding a song to the party queue. */
function AddSongSheet({ code, onClose, onAdded }: { code: string; onClose: () => void; onAdded: () => void }) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Track[] | null>(null);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const t = setTimeout(() => {
      searchPartySongs(q).then((r) => { if (live) setResults(r); }).catch(() => { if (live) setResults([]); });
    }, q ? 300 : 0);
    return () => { live = false; clearTimeout(t); };
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Add a song" onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[80dvh] max-w-xl flex-col rounded-t-[28px] border-t border-primary/60 bg-bg px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 lg:bottom-6 lg:rounded-[28px] lg:border">
        <div className="flex items-center justify-between">
          <p className="m-0 text-[18px] font-semibold text-white">Add a song</p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/10 text-ink"><Icon name="x" size={18} /></button>
        </div>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="field mt-3" placeholder="Search songs or artists" aria-label="Search songs" />
        <ul className="no-scrollbar m-0 mt-3 flex-1 list-none overflow-y-auto p-0">
          {results === null && <li className="py-6 text-center text-[14px] text-muted">Loading…</li>}
          {results?.length === 0 && <li className="py-6 text-center text-[14px] text-muted">No songs found.</li>}
          {results?.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-1.5">
              <span className="w-11 shrink-0"><Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] text-white">{t.title}</span>
                <span className="block truncate text-[12.5px] font-light text-muted">{t.artistName} · {fmtTime(t.durationSec)}</span>
              </span>
              <button
                type="button" disabled={adding === t.id} className="btn btn-outline btn-sm"
                onClick={async () => {
                  setAdding(t.id);
                  const r = await addPartySong(code, t.id).catch(() => ({ ok: false as const, error: "Could not add the song." }));
                  setAdding(null);
                  if (r.ok) { toast(`Added ${t.title}`); onAdded(); onClose(); } else toast(r.error);
                }}
              >
                {adding === t.id ? "Adding…" : "Add"}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const QUICK = ["🔥 Fire", "Turn it up", "Play it again", "Hello everyone"];

/** The live party room: now playing, vote queue, people and chat. Polls the server for changes. */
export function PartyRoom({ initial }: { initial: PartyState }) {
  const router = useRouter();
  const toast = useToast();
  const player = usePlayer();
  const [s, setS] = useState(initial);
  const [tab, setTab] = useState<"queue" | "chat">("queue");
  // Seconds since the last poll, so the progress bar moves smoothly between polls.
  const [drift, setDrift] = useState(0);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [joining, setJoining] = useState(false);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/party/${initial.code}`, { cache: "no-store" });
      if (r.status === 401) return router.push("/login");
      if (!r.ok) return;
      const next = (await r.json()) as PartyState;
      setS(next);
      setDrift(0);
    } catch {
      // Offline for a moment; the next poll catches up.
    }
  }, [initial.code, router]);

  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) void poll(); }, 3500);
    const clock = setInterval(() => setDrift((n) => n + 1), 1000);
    const onShow = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", onShow);
    return () => { clearInterval(t); clearInterval(clock); document.removeEventListener("visibilitychange", onShow); };
  }, [poll]);

  useEffect(() => { if (tab === "chat") chatEnd.current?.scrollIntoView({ block: "end" }); }, [tab, s.messages.length]);

  const elapsed = s.now ? Math.min(s.now.durationSec, s.now.elapsed + drift) : 0;
  const remaining = s.now ? Math.max(0, s.now.durationSec - elapsed) : 0;

  const act = async (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    const r = await fn().catch(() => ({ ok: false, error: "Something went wrong. Check your connection." }));
    if (!r.ok && r.error) toast(r.error);
    void poll();
    return r.ok;
  };

  const invite = async () => {
    const url = `${location.origin}/party/${s.code}`;
    try {
      if (navigator.share) await navigator.share({ title: s.name, text: `Join my Brisic party with code ${s.code}`, url });
      else { await navigator.clipboard.writeText(url); toast("Invite link copied"); }
    } catch { /* closed the share sheet */ }
  };

  if (s.ended) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center">
        <p className="m-0 text-[20px] font-semibold text-white">This party has ended</p>
        <p className="m-0 mt-2 text-[14px] font-light text-muted">{s.name} hosted by {s.hostName} is over. Start your own and invite friends.</p>
        <Link href="/party?create=1" className="btn btn-primary mt-4">Create a party</Link>
      </div>
    );
  }

  if (!s.isMember) {
    return (
      <div className="panel-glow mx-auto max-w-md p-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary text-primary"><Icon name="users" size={30} /></span>
        <p className="m-0 mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">● Live party · {s.listening} listening</p>
        <h1 className="m-0 mt-1 text-[26px] font-bold text-white">{s.name}</h1>
        <p className="m-0 mt-1 text-[14px] font-light text-ink/80">Hosted by {s.hostName}</p>
        <button
          type="button" disabled={joining} className="btn btn-primary mt-5 w-full !h-[52px]"
          onClick={async () => { setJoining(true); await act(() => joinParty(s.code)); setJoining(false); }}
        >
          <Icon name="users" size={18} /> {joining ? "Joining…" : "Join Party"}
        </button>
      </div>
    );
  }

  const chips = ["LIVE", s.isPublic ? "PUBLIC" : "PRIVATE", "FREE TO JOIN", s.chatOpen ? "CHAT OPEN" : "CHAT CLOSED"];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => router.push("/party")} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-primary/70 bg-black/30 text-ink"><Icon name="back" size={18} /></button>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-primary">● LIVE PARTY</span>
        <button type="button" onClick={invite} className="btn btn-outline btn-sm">Invite</button>
      </div>
      <h1 className="m-0 mt-3 text-center text-[26px] font-bold text-white">{s.name}</h1>
      <p className="m-0 text-center text-[13px] font-light text-muted">{s.listening} listening · hosted by {s.hostName} · code <span className="font-semibold tracking-wider text-ink">{s.code}</span></p>
      <div className="mt-2 flex flex-wrap justify-center gap-1.5">
        {chips.map((c) => <span key={c} className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-semibold tracking-wider text-ink/85">● {c}</span>)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-full border border-line p-1">
        {(["queue", "chat"] as const).map((t) => (
          <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)} className={`h-9 rounded-full border-0 text-[14.5px] capitalize ${tab === t ? "bg-primary font-semibold text-primary-ink" : "bg-transparent text-ink"}`}>
            {t === "chat" ? `Chat (${s.messages.filter((m) => m.text !== "joined the party").length})` : "Queue"}
          </button>
        ))}
      </div>

      {tab === "queue" ? (
        <>
          <div className="panel-glow mt-4 p-3">
            {s.now ? (
              <div className="flex items-center gap-3">
                <span className="w-16 shrink-0"><Cover seed={s.now.trackId} label={s.now.title} className="!rounded-xl" /></span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-[10.5px] font-bold uppercase tracking-[0.16em] text-primary">Now playing</p>
                  <p className="m-0 truncate text-[17px] font-semibold text-white">{s.now.title}</p>
                  <p className="m-0 truncate text-[12.5px] font-light text-muted">{s.now.artistName} · added by {s.now.addedByName}</p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/15"><div className="h-full bg-primary" style={{ width: `${(elapsed / Math.max(1, s.now.durationSec)) * 100}%` }} /></div>
                </div>
              </div>
            ) : (
              <p className="m-0 py-3 text-center text-[14px] font-light text-ink/80">Nothing playing yet. Add a song to start the party.</p>
            )}
            {s.now && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button" className="btn btn-sm flex-1"
                  onClick={async () => {
                    const [t] = await partyTracks([s.now!.trackId]).catch(() => []);
                    player.playQueue([t ?? asTrack(s.now!)], 0);
                    setTimeout(() => player.seek(elapsed), 50);
                  }}
                >
                  <Icon name="play" size={14} /> Listen along
                </button>
                {s.isHost && <button type="button" className="btn btn-sm" onClick={() => act(() => skipPartySong(s.code))}><Icon name="next" size={14} /> Skip</button>}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-baseline justify-between">
            <h2 className="m-0 text-[17px] font-semibold text-white">Vote: up next</h2>
            {s.now && <span className="text-[12.5px] text-muted">Next song in {fmtTime(remaining)}</span>}
          </div>
          {s.upNext.length === 0 ? (
            <p className="m-0 mt-2 text-[14px] font-light text-muted">The queue is empty. Add songs and everyone can vote.</p>
          ) : (
            <ol className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
              {s.upNext.map((q, i) => (
                <li key={q.id} className={`flex items-center gap-3 rounded-2xl border p-2 ${i === 0 ? "border-primary/60 bg-primary/5" : "border-line"}`}>
                  <span className="w-5 text-center text-[13px] tabular-nums text-muted">{i + 1}</span>
                  <span className="w-11 shrink-0"><Cover seed={q.trackId} className="!rounded-lg" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-white">{q.title}</span>
                    <span className="block truncate text-[12px] font-light text-muted">{q.artistName} · added by {q.mine ? "you" : q.addedByName}</span>
                  </span>
                  <button
                    type="button" aria-pressed={q.voted} aria-label={`${q.voted ? "Remove vote for" : "Vote for"} ${q.title}, ${q.votes} votes`}
                    onClick={() => {
                      // Show the vote at once; the next poll confirms the real count.
                      setS((cur) => ({ ...cur, upNext: cur.upNext.map((x) => (x.id === q.id ? { ...x, voted: !x.voted, votes: x.votes + (x.voted ? -1 : 1) } : x)) }));
                      void act(() => votePartySong(q.id));
                    }}
                    className={`flex h-9 min-w-[56px] items-center justify-center gap-1 rounded-full border-[1.5px] px-3 text-[13.5px] font-semibold ${q.voted ? "border-primary bg-primary text-primary-ink" : "border-primary/70 bg-transparent text-ink"}`}
                  >
                    ↑ {q.votes}
                  </button>
                </li>
              ))}
            </ol>
          )}

          <h2 className="m-0 mt-5 text-[17px] font-semibold text-white">In the room</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {s.members.map((m) => (
              <span key={m.id} className="flex items-center gap-1.5 rounded-full border border-line py-1 pl-1 pr-3 text-[13px] text-ink">
                <Initial name={m.name} />
                {m.name}
                {m.you && <span className="text-[11px] text-muted">You</span>}
                {m.host && <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-ink">Host</span>}
              </span>
            ))}
          </div>

          <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] mt-6 flex gap-2 lg:bottom-24">
            <button type="button" className="btn btn-primary !h-[50px] flex-1" onClick={() => setAdding(true)}><Icon name="plus" size={18} /> Add a song</button>
            <button
              type="button" className="btn !h-[50px] border-[#ff6b6b]/70 text-[#ff8a8a]"
              onClick={async () => {
                if (s.isHost && !confirm("End the party for everyone?")) return;
                await leaveParty(s.code).catch(() => null);
                router.push("/party");
              }}
            >
              {s.isHost ? "End" : "Leave"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex min-h-[40dvh] flex-col gap-2.5">
            <p className="m-0 text-center text-[12px] font-light text-muted">Be kind in the chat. Everyone here came to enjoy the music.</p>
            {s.messages.map((m) =>
              m.text === "joined the party" ? (
                <p key={m.id} className="m-0 text-center text-[12px] text-muted">{m.userName} joined the party</p>
              ) : (
                <div key={m.id} className={`flex items-end gap-2 ${m.you ? "flex-row-reverse" : ""}`}>
                  <Initial name={m.userName} size={28} />
                  <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${m.you ? "rounded-br-sm bg-primary/20" : "rounded-bl-sm bg-white/[0.07]"}`}>
                    <p className="m-0 text-[11.5px] text-muted">{m.you ? "You" : m.userName}{m.host ? " · Host" : ""}</p>
                    <p className="m-0 break-words text-[14.5px] text-white">{m.text}</p>
                  </div>
                </div>
              ),
            )}
            <div ref={chatEnd} />
          </div>
          {s.isHost && (
            <button type="button" className="btn btn-sm mt-3" onClick={() => act(() => setPartyChat(s.code, !s.chatOpen))}>
              {s.chatOpen ? "Close chat for listeners" : "Open chat for everyone"}
            </button>
          )}
          {s.chatOpen || s.isHost ? (
            <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] mt-3 bg-bg/90 pb-1 pt-2 backdrop-blur lg:bottom-24">
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {QUICK.map((q) => <button key={q} type="button" className="chip shrink-0" onClick={() => act(() => sendPartyMessage(s.code, q))}>{q}</button>)}
              </div>
              <form
                className="mt-2 flex items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!text.trim() || busy) return;
                  setBusy(true);
                  if (await act(() => sendPartyMessage(s.code, text))) setText("");
                  setBusy(false);
                }}
              >
                <button type="button" aria-label="Add a song" onClick={() => setAdding(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-primary bg-transparent text-primary"><Icon name="plus" size={20} /></button>
                <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} className="field !h-11" placeholder="Say something to the room…" aria-label="Message" />
                <button type="submit" aria-label="Send" disabled={!text.trim() || busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-primary text-primary-ink disabled:opacity-40"><Icon name="send" size={18} /></button>
              </form>
            </div>
          ) : (
            <p className="m-0 mt-4 text-center text-[13.5px] text-muted">The host has closed the chat.</p>
          )}
        </>
      )}

      {adding && <AddSongSheet code={s.code} onClose={() => setAdding(false)} onAdded={() => void poll()} />}
    </div>
  );
}
