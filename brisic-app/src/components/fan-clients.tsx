"use client";

import { useState } from "react";
import Link from "next/link";
import type { Track } from "@/lib/catalog/types";
import { askBrisicAI, sendGift, unlockExclusive } from "@/app/actions";
import { EXCLUSIVES, GIFTS, MERCH } from "@/lib/fan";
import { fmtCoins } from "@/lib/format";
import { Icon } from "@/components/icons";
import { useLibrary, useToast } from "@/components/app-state";
import { TrackList } from "@/components/track-list";

export function GiftSender({ artistId, artistName }: { artistId: string; artistName: string }) {
  const lib = useLibrary();
  const [sel, setSel] = useState("crown");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<{ name: string; qty: number; msg: string } | null>(null);

  const gift = GIFTS.find((g) => g.id === sel)!;
  const total = gift.price * qty;
  const short = total - lib.coins;

  if (sent) {
    return (
      <div className="panel mx-auto max-w-md p-6 text-center">
        <p className="m-0 text-5xl" aria-hidden="true">🎁</p>
        <h2 className="m-0 mt-3 text-[22px] font-semibold text-white">Gift sent!</h2>
        <p className="m-0 mt-2 text-[15px] font-light text-ink/90">You sent {sent.qty} × {sent.name} to {artistName}.</p>
        {sent.msg && <p className="m-0 mt-2 text-[14.5px] italic text-muted">“{sent.msg}”</p>}
        <p className="m-0 mt-3 text-[14px] text-[#f2c94c]">Balance: {fmtCoins(lib.coins)} B-Coins</p>
        <div className="mt-5 flex justify-center gap-2.5">
          <button type="button" className="btn btn-primary" onClick={() => setSent(null)}>Send another</button>
          <Link href={`/artist/${artistId}`} className="btn">Done</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <p className="m-0 mb-3 text-[14.5px] text-muted">
        Sending to <span className="font-medium text-white">{artistName}</span> · Balance{" "}
        <Link href="/coins" className="font-semibold text-[#f2c94c]">{fmtCoins(lib.coins)} B-Coins</Link>
      </p>
      <div role="radiogroup" aria-label="Choose a gift" className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        {GIFTS.map((g) => (
          <button
            key={g.id} type="button" role="radio" aria-checked={sel === g.id} onClick={() => setSel(g.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 ${sel === g.id ? "border-primary bg-primary/10" : "border-line bg-white/[0.03] hover:bg-white/[0.06]"}`}
          >
            <span className="text-3xl" aria-hidden="true">{g.emoji}</span>
            <span className="text-[13.5px] font-medium text-white">{g.name}</span>
            <span className="text-[12.5px] font-semibold text-[#f2c94c]">{fmtCoins(g.price)}</span>
          </button>
        ))}
      </div>

      <div className="panel mt-5 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[17px] font-semibold text-white">{gift.emoji} {gift.name}</p>
            <p className="m-0 text-[13.5px] font-light text-muted">{gift.tag}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Fewer" className="btn btn-sm !w-9 !px-0" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-6 text-center text-[17px] font-semibold tabular-nums text-white" aria-live="polite">{qty}</span>
            <button type="button" aria-label="More" className="btn btn-sm !w-9 !px-0" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
          </div>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 flex justify-between text-[13px] text-muted"><span>Message to the artist (optional)</span><span>{msg.length}/140</span></span>
          <input className="field" value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 140))} placeholder="Say something kind" />
        </label>
        {error && <p role="alert" className="m-0 mt-3 text-[14px] text-[#ff9b9b]">{error}</p>}
        {short > 0 ? (
          <div className="mt-4">
            <p className="m-0 text-[14px] text-[#ff9b9b]">You need {fmtCoins(short)} more B-Coins.</p>
            <Link href="/coins" className="btn mt-2.5 w-full">Get Coins</Link>
          </div>
        ) : (
          <button
            type="button" className="btn btn-primary mt-4 w-full !h-[50px]" disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError("");
              const r = await sendGift(artistId, gift.id, qty, msg).catch(() => null);
              setBusy(false);
              if (!r || !r.ok) return setError(r && !r.ok ? r.error : "Could not send the gift. Try again.");
              lib.setCoins(r.balance);
              setSent({ name: gift.name, qty, msg: msg.trim() });
              setMsg("");
              setQty(1);
            }}
          >
            {busy ? "Sending…" : `Send Gift · ${fmtCoins(total)} B-Coins`}
          </button>
        )}
        <p className="m-0 mt-2.5 text-center text-[12.5px] font-light text-muted">Balance after sending: {fmtCoins(Math.max(0, lib.coins - total))} B-Coins</p>
      </div>
    </>
  );
}

export function ExclusiveList({ artistId, artistName, unlocked }: { artistId: string; artistName: string; unlocked: string[] }) {
  const lib = useLibrary();
  const toast = useToast();
  const [open, setOpen] = useState(() => new Set(unlocked));
  const [confirm, setConfirm] = useState<(typeof EXCLUSIVES)[number] | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <p className="m-0 mb-4 text-[14.5px] text-muted">
        Your balance <Link href="/coins" className="font-semibold text-[#f2c94c]">{fmtCoins(lib.coins)} B-Coins</Link>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {EXCLUSIVES.map((it) => {
          const has = open.has(it.key);
          return (
            <div key={it.key} className="panel flex flex-col gap-2 p-4">
              <p className="m-0 text-[11.5px] font-semibold uppercase tracking-[0.14em] text-accent">{it.kind}</p>
              <p className="m-0 text-[18px] font-semibold text-white">{it.title}</p>
              <p className="m-0 flex-1 text-[14px] font-light text-ink/85">{it.desc}</p>
              <p className="m-0 text-[12.5px] text-muted">{it.meta}</p>
              {has ? (
                <p className="m-0 mt-1 flex items-center gap-2 text-[14.5px] font-medium text-primary"><Icon name="check" size={18} /> Unlocked. You will get it as soon as {artistName} releases it.</p>
              ) : (
                <button type="button" className="btn btn-primary mt-1" onClick={() => setConfirm(it)}><Icon name="lock" size={17} /> Unlock · {it.price} B</button>
              )}
            </div>
          );
        })}
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={() => !busy && setConfirm(null)}>
          <div role="dialog" aria-label="Confirm unlock" className="panel w-full max-w-md rounded-b-none bg-[#0b1a11] p-5 sm:rounded-b-[20px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="m-0 text-[19px] font-semibold text-white">Unlock “{confirm.title}”?</h3>
            {lib.coins >= confirm.price ? (
              <>
                <p className="m-0 mt-2 text-[14.5px] font-light text-ink/90">You will have {fmtCoins(lib.coins - confirm.price)} B-Coins left.</p>
                <button
                  type="button" className="btn btn-primary mt-4 w-full" disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const r = await unlockExclusive(artistId, confirm.key).catch(() => null);
                    setBusy(false);
                    if (!r || !r.ok) return toast(r && !r.ok ? r.error : "Could not unlock. Try again.");
                    lib.setCoins(r.balance);
                    setOpen((s) => new Set(s).add(confirm.key));
                    setConfirm(null);
                    toast("Unlocked");
                  }}
                >
                  {busy ? "Unlocking…" : `Pay ${confirm.price} B-Coins`}
                </button>
              </>
            ) : (
              <>
                <p className="m-0 mt-2 text-[14.5px] text-[#ff9b9b]">You need {fmtCoins(confirm.price - lib.coins)} more B-Coins.</p>
                <Link href="/coins" className="btn mt-4 w-full">Get Coins</Link>
              </>
            )}
            <button type="button" className="btn mt-2.5 w-full" disabled={busy} onClick={() => setConfirm(null)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

export function MerchGrid() {
  const [cart, setCart] = useState<Set<string>>(new Set());
  const total = MERCH.filter((m) => cart.has(m.id)).reduce((n, m) => n + m.price, 0);
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        {MERCH.map((m) => {
          const on = cart.has(m.id);
          return (
            <div key={m.id} className="panel overflow-hidden">
              <div className="flex aspect-[4/3] items-center justify-center text-white/90" style={{ background: m.bg }}><Icon name="bag" size={44} /></div>
              <div className="flex items-center gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-[15px] font-medium text-white">{m.name}</p>
                  <p className="m-0 text-[13.5px] text-muted">${m.price}</p>
                </div>
                <button
                  type="button" aria-pressed={on} className={`btn btn-sm ${on ? "btn-primary" : ""}`}
                  onClick={() => setCart((c) => { const n = new Set(c); if (on) n.delete(m.id); else n.add(m.id); return n; })}
                >
                  {on ? "Added" : "Add"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="panel mt-5 flex flex-wrap items-center gap-3 p-4">
        <p className="m-0 flex-1 text-[15px] text-ink">{cart.size} in cart · <span className="font-semibold text-white">${total}</span></p>
        <button type="button" className="btn btn-primary" disabled>Checkout</button>
        <p className="m-0 w-full text-[12.5px] font-light text-muted">Merch checkout opens when payments and shipping go live. Nothing is ordered or charged.</p>
      </div>
    </>
  );
}

type Turn = { from: "you" | "ai"; text: string; tracks?: Track[] };
const CHIPS = ["Play Afrobeats", "Chill vibes", "Something for a party", "Worship songs", "Top tracks right now"];

export function AIChat() {
  const [turns, setTurns] = useState<Turn[]>([{ from: "ai", text: "Tell me what you feel like hearing: a genre, a mood or an artist." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const ask = async (prompt: string) => {
    const q = prompt.trim();
    if (!q || busy) return;
    setText("");
    setBusy(true);
    setTurns((t) => [...t, { from: "you", text: q }]);
    const r = await askBrisicAI(q).catch(() => null);
    setTurns((t) => [...t, r ? { from: "ai", text: r.reply, tracks: r.tracks } : { from: "ai", text: "I could not reach the catalog. Try again in a moment." }]);
    setBusy(false);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3">
      <div className="flex flex-col gap-3" aria-live="polite">
        {turns.map((t, i) => (
          <div key={i} className={t.from === "you" ? "self-end" : "self-start w-full"}>
            <p className={`m-0 inline-block max-w-full rounded-2xl px-4 py-2.5 text-[15px] ${t.from === "you" ? "bg-primary text-primary-ink" : "border border-line bg-white/[0.05] text-ink"}`}>{t.text}</p>
            {t.tracks && t.tracks.length > 0 && <div className="mt-2"><TrackList tracks={t.tracks} numbered={false} showStreams={false} /></div>}
          </div>
        ))}
        {busy && <p className="m-0 text-[14px] font-light text-muted">Thinking…</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => <button key={c} type="button" className="btn btn-sm font-normal" onClick={() => ask(c)} disabled={busy}>{c}</button>)}
      </div>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input className="field" aria-label="Ask Brisic AI" placeholder="Ask for a genre, mood or artist" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} />
        <button className="btn btn-primary shrink-0 !h-12" disabled={busy || !text.trim()}>Ask</button>
      </form>
    </div>
  );
}
