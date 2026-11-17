"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Track } from "@/lib/catalog/types";
import { askBrisicAI, sendGift, unlockExclusive } from "@/app/actions";
import { EXCLUSIVES, GIFTS, GIFT_TIERS, MERCH } from "@/lib/fan";
import { fmtCoins } from "@/lib/format";
import { Cover } from "@/components/cover";
import { GiftIcon } from "@/components/gift-icons";
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
  const [sent, setSent] = useState<{ id: string; name: string; qty: number; msg: string } | null>(null);

  const gift = GIFTS.find((g) => g.id === sel)!;
  const total = gift.price * qty;
  const short = total - lib.coins;

  if (sent) {
    return (
      <div className="panel-glow mx-auto max-w-md p-6 text-center">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/60 bg-black/30 text-primary" style={{ animation: "brisicPulse 2.4s ease-in-out infinite" }}>
          <GiftIcon id={sent.id} size={52} />
        </span>
        <h2 className="m-0 mt-4 text-[22px] font-semibold text-white">Gift sent!</h2>
        <p className="m-0 mt-2 text-[15px] font-light text-ink/90">You sent {sent.qty} × {sent.name} to {artistName}.</p>
        {sent.msg && <p className="m-0 mt-2 text-[14.5px] italic text-muted">“{sent.msg}”</p>}
        <p className="m-0 mt-3 flex items-center justify-center gap-1.5 text-[14px] text-[#f2c94c]"><Image src="/assets/coin.png" alt="" width={16} height={16} /> Balance: {fmtCoins(lib.coins)}</p>
        <div className="mt-5 flex justify-center gap-2.5">
          <button type="button" className="btn btn-primary" onClick={() => setSent(null)}>Send another</button>
          <Link href={`/artist/${artistId}`} className="btn">Done</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="panel flex items-center gap-3 p-3">
        <span className="w-12 shrink-0"><Cover seed={artistId} round /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12px] font-light text-muted">Sending to</span>
          <span className="flex items-center gap-1.5 text-[16px] font-semibold text-white">
            <span className="truncate">{artistName}</span>
            <Icon name="check" size={13} className="shrink-0 rounded-full bg-primary p-[1px] text-primary-ink" />
          </span>
        </span>
        <Link href="/coins" aria-label={`${lib.coins} B-Coins, get more`} className="flex h-9 items-center gap-1.5 rounded-full border border-primary/60 px-3 text-[14px] font-semibold text-white">
          <Image src="/assets/coin.png" alt="" width={18} height={18} /> {fmtCoins(lib.coins)} <Icon name="plus" size={14} className="text-primary" />
        </Link>
      </div>

      <div role="radiogroup" aria-label="Choose a gift">
        {GIFT_TIERS.map((tier) => (
          <section key={tier.id} className="mt-5">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <h3 className="m-0 text-[14px] font-semibold uppercase tracking-[0.12em] text-primary">{tier.name} gifts</h3>
              <span className="truncate text-[12.5px] font-light text-muted">{tier.blurb}</span>
            </div>
            <div className={`grid gap-2.5 ${tier.gifts.length === 2 ? "grid-cols-2" : tier.gifts.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
              {tier.gifts.map((id) => {
                const g = GIFTS.find((x) => x.id === id)!;
                const on = sel === g.id;
                const rare = tier.id === "legend" || tier.id === "icon";
                return (
                  <button
                    key={g.id} type="button" role="radio" aria-checked={on} onClick={() => setSel(g.id)}
                    className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border px-2 py-3 transition ${on ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)]" : rare ? "border-[#f2c94c]/40 bg-[linear-gradient(160deg,rgba(242,201,76,0.12),transparent)] hover:border-[#f2c94c]/70" : "border-line bg-white/[0.03] hover:bg-white/[0.06]"}`}
                  >
                    <GiftIcon id={g.id} size={rare ? 44 : 36} className={rare ? "text-[#f2c94c] drop-shadow-[0_0_8px_rgba(242,201,76,0.5)]" : "text-primary drop-shadow-[0_0_6px_rgba(var(--primary-rgb),0.45)]"} />
                    <span className="text-[13.5px] font-medium text-white">{g.name}</span>
                    <span className="flex items-center gap-1 text-[12.5px] font-semibold text-[#f2c94c]">
                      <Image src="/assets/coin.png" alt="" width={13} height={13} /> {fmtCoins(g.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="panel-glow mt-6 p-4">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/50 bg-black/30 text-primary">
            <GiftIcon id={gift.id} size={38} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[18px] font-semibold text-white">{gift.name}</p>
            <p className="m-0 text-[13px] font-light text-ink/80">{gift.tag}</p>
            <div className="mt-2 flex items-center gap-3">
              <button type="button" aria-label="Fewer" className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-transparent text-ink" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span className="w-6 text-center text-[17px] font-semibold tabular-nums text-white" aria-live="polite">{qty}</span>
              <button type="button" aria-label="More" className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-transparent text-ink" onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-1 self-end text-[20px] font-bold text-[#f2c94c]"><Image src="/assets/coin.png" alt="" width={20} height={20} /> {fmtCoins(total)}</span>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 flex justify-between text-[12.5px] text-muted"><span>Message to the artist (optional)</span><span>{msg.length}/140</span></span>
          <textarea className="field !h-20 !rounded-2xl !py-3" value={msg} onChange={(e) => setMsg(e.target.value.slice(0, 140))} placeholder="Type a message to go with your gift…" />
        </label>
        {error && <p role="alert" className="m-0 mt-3 text-[14px] text-[#ff9b9b]">{error}</p>}
        {short > 0 ? (
          <div className="mt-4">
            <Link href="/coins" className="btn btn-primary w-full !h-[50px]">Buy more B-Coins</Link>
            <p className="m-0 mt-2 text-center text-[13px] text-ink/80">You need {fmtCoins(short)} more B-Coins</p>
          </div>
        ) : (
          <>
            <button
              type="button" className="btn btn-primary mt-4 w-full !h-[50px]" disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                const r = await sendGift(artistId, gift.id, qty, msg).catch(() => null);
                setBusy(false);
                if (!r || !r.ok) return setError(r && !r.ok ? r.error : "Could not send the gift. Try again.");
                lib.setCoins(r.balance);
                setSent({ id: gift.id, name: gift.name, qty, msg: msg.trim() });
                setMsg("");
                setQty(1);
              }}
            >
              {busy ? "Sending…" : `Send ${qty > 1 ? qty + " × " : ""}${gift.name}`}
            </button>
            <p className="m-0 mt-2.5 text-center text-[12.5px] font-light text-muted">Balance after sending: {fmtCoins(Math.max(0, lib.coins - total))} B-Coins</p>
          </>
        )}
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

const PAY_METHODS = ["Card", "Bank transfer", "USSD", "Mobile money"] as const;

function CoinStack({ gold, size = 44 }: { gold: boolean; size?: number }) {
  return (
    <Image
      src="/assets/coin.png" alt="" width={size} height={size}
      className="object-contain"
      style={{ width: size, height: size, filter: gold ? "sepia(1) saturate(2.4) hue-rotate(-8deg) brightness(1.08) drop-shadow(0 0 8px rgba(242,201,76,0.55))" : "grayscale(1) brightness(1.35) drop-shadow(0 0 6px rgba(220,230,235,0.35))" }}
    />
  );
}

/** Naira top-up bundles, checked out with Paystack once payments go live. */
export function CoinShop({ packs }: { packs: { coins: number; metal: string; priceNaira: number }[] }) {
  const [sel, setSel] = useState(packs[2]?.coins ?? packs[0].coins);
  const [method, setMethod] = useState<(typeof PAY_METHODS)[number]>("Card");
  const pack = packs.find((p) => p.coins === sel) ?? packs[0];
  return (
    <>
      <div role="radiogroup" aria-label="Choose a B-Coin bundle" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {packs.map((p) => {
          const on = p.coins === sel;
          const gold = p.metal === "Gold";
          return (
            <button
              key={p.coins} type="button" role="radio" aria-checked={on} onClick={() => setSel(p.coins)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl border px-2 pb-3 pt-4 transition ${on ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(var(--primary-rgb),0.3)]" : gold ? "border-[#f2c94c]/35 bg-[linear-gradient(160deg,rgba(242,201,76,0.1),transparent)]" : "border-line bg-white/[0.03]"}`}
            >
              {p.coins === 1_000 && <span className="absolute -top-2 rounded-full bg-primary px-2 text-[10.5px] font-bold text-primary-ink">POPULAR</span>}
              {p.coins === 250_000 && <span className="absolute -top-2 rounded-full bg-[#f2c94c] px-2 text-[10.5px] font-bold text-black">BEST VALUE</span>}
              <CoinStack gold={gold} />
              <span className="text-[19px] font-bold text-white">{fmtCoins(p.coins)}</span>
              <span className="text-[11.5px] uppercase tracking-wider text-muted">{p.metal} coins</span>
              <span className={`mt-1 rounded-full px-3 py-0.5 text-[14px] font-semibold ${on ? "bg-primary text-primary-ink" : "bg-white/10 text-ink"}`}>₦{fmtCoins(p.priceNaira)}</span>
            </button>
          );
        })}
      </div>

      <div className="panel-glow mt-5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[13px] font-light text-ink/80">You get</p>
            <p className="m-0 flex items-center gap-1.5 text-[22px] font-bold text-white"><CoinStack gold={pack.metal === "Gold"} size={24} /> {fmtCoins(pack.coins)} B-Coins</p>
          </div>
          <div className="text-right">
            <p className="m-0 text-[13px] font-light text-ink/80">You pay</p>
            <p className="m-0 text-[22px] font-bold text-primary">₦{fmtCoins(pack.priceNaira)}</p>
          </div>
        </div>
        <p className="m-0 mb-2 mt-4 text-[13px] font-semibold text-white">Pay with</p>
        <div className="flex flex-wrap gap-2">
          {PAY_METHODS.map((m) => (
            <button key={m} type="button" aria-pressed={method === m} onClick={() => setMethod(m)} className="chip">{m}</button>
          ))}
        </div>
        <button type="button" disabled className="btn btn-primary mt-4 w-full !h-[50px]">
          Pay ₦{fmtCoins(pack.priceNaira)} with Paystack
        </button>
        <p className="m-0 mt-2 flex items-center justify-center gap-1.5 text-center text-[12.5px] font-light text-muted">
          <Icon name="lock" size={13} /> Secured by Paystack · Checkout opens when payments go live
        </p>
      </div>
    </>
  );
}
