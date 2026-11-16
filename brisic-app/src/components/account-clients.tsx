"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile, updateSettings, type ProfileState } from "@/app/actions";
import { LANGUAGES, PLAYER_COLORS, QUALITIES, type Settings } from "@/lib/settings";
import { PREMIUM_PERKS, PREMIUM_PLANS, PREMIUM_REGIONS } from "@/lib/fan";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/app-state";

export function EditProfileForm({ name, username, bio }: { name: string; username: string; bio: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    async (prev, form) => {
      const r = await updateProfile(prev, form);
      if (r.ok) router.push("/profile");
      return r;
    },
    {},
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] text-muted">Display name</span>
        <input name="name" className="field" defaultValue={name} maxLength={40} required />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] text-muted">Username</span>
        <span className="relative block">
          <span className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-muted">@</span>
          <input name="username" className="field !pl-9" defaultValue={username} maxLength={20} pattern="[a-zA-Z0-9_]{3,20}" autoCapitalize="none" required />
        </span>
        <span className="mt-1.5 block text-[12.5px] font-light text-muted">3 to 20 letters, numbers or underscores.</span>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[13.5px] text-muted">Bio</span>
        <textarea name="bio" className="field !h-24 !rounded-2xl !py-3" defaultValue={bio} maxLength={160} placeholder="Tell people what you listen to" />
      </label>
      {state.error && <p role="alert" className="m-0 text-[14px] text-[#ff9b9b]">{state.error}</p>}
      <div className="flex gap-2.5">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
        <Link href="/profile" className="btn">Cancel</Link>
      </div>
    </form>
  );
}

function Toggle({ label, sub, on, onChange }: { label: string; sub: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-3 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-medium text-ink">{label}</span>
        <span className="block text-[13px] font-light text-muted">{sub}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-white/15 transition peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[#bbf7d0] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}

function Choice({ label, sub, value, options, onChange }: { label: string; sub: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-3 px-3 py-3">
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-medium text-ink">{label}</span>
        <span className="block text-[13px] font-light text-muted">{sub}</span>
      </span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 rounded-full border border-line bg-[#0b1a11] px-3 text-[14px] text-ink">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState(initial);

  const save = (patch: Partial<Settings>) => {
    const before = s;
    setS({ ...s, ...patch });
    updateSettings(patch)
      .then(() => { if ("playerColor" in patch) router.refresh(); })
      .catch(() => { setS(before); toast("Could not save. Check your connection."); });
  };
  const group = "panel divide-y divide-white/5 p-1";
  const heading = "mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent first:mt-0";

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className={heading}>Music player color</h2>
      <div className="panel p-4">
        <p className="m-0 text-[13.5px] font-light text-muted">Pick the color of the player. The rest of the app stays green.</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {PLAYER_COLORS.map((c) => (
            <button
              key={c.id} type="button" aria-label={c.name} aria-pressed={s.playerColor === c.id} title={c.name}
              onClick={() => save({ playerColor: c.id })}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-2 text-black ${s.playerColor === c.id ? "border-white" : "border-transparent"}`}
              style={{ background: c.hex }}
            >
              {s.playerColor === c.id && <Icon name="check" size={20} />}
            </button>
          ))}
        </div>
      </div>

      <h2 className={heading}>Playback</h2>
      <div className={group}>
        <Toggle label="Crossfade songs" sub="Fade between tracks" on={s.crossfade} onChange={(v) => save({ crossfade: v })} />
        <Toggle label="Gapless playback" sub="No pause between songs" on={s.gapless} onChange={(v) => save({ gapless: v })} />
        <Toggle label="Autoplay similar music" sub="Keep playing when your queue ends" on={s.autoplay} onChange={(v) => save({ autoplay: v })} />
        <Toggle label="Normalize volume" sub="Same loudness for every song" on={s.normalize} onChange={(v) => save({ normalize: v })} />
      </div>

      <h2 className={heading}>Audio quality</h2>
      <div className={group}>
        <Choice label="Streaming quality" sub="Higher quality uses more data" value={s.streamingQuality} options={QUALITIES} onChange={(v) => save({ streamingQuality: v })} />
        <Choice label="Download quality" sub="Quality of music saved in the app" value={s.downloadQuality} options={QUALITIES} onChange={(v) => save({ downloadQuality: v })} />
        <Toggle label="Data saver" sub="Lower quality on mobile data" on={s.dataSaver} onChange={(v) => save({ dataSaver: v })} />
        <Toggle label="Download over Wi-Fi only" sub="Save your mobile data" on={s.wifiOnly} onChange={(v) => save({ wifiOnly: v })} />
      </div>

      <h2 className={heading}>Notifications</h2>
      <div className={group}>
        <Toggle label="New releases" sub="Songs from artists you follow" on={s.notifyReleases} onChange={(v) => save({ notifyReleases: v })} />
        <Toggle label="Community parties" sub="When a party starts" on={s.notifyParty} onChange={(v) => save({ notifyParty: v })} />
        <Toggle label="Gifts and messages" sub="Gift receipts and artist messages" on={s.notifyGifts} onChange={(v) => save({ notifyGifts: v })} />
      </div>

      <h2 className={heading}>Privacy and language</h2>
      <div className={group}>
        <Toggle label="Private session" sub="Songs you play are not added to your history" on={s.privateSession} onChange={(v) => save({ privateSession: v })} />
        <Choice label="Language" sub="More languages arrive as translations are added" value={s.language} options={LANGUAGES} onChange={(v) => save({ language: v })} />
      </div>
      <p className="mt-4 text-[12.5px] font-light text-muted">
        Player color and Private session apply now. Playback, quality and language choices are saved to your account and take effect as audio and translations are connected.
      </p>
    </div>
  );
}

export function PremiumPlans({ isPremium }: { isPremium: boolean }) {
  const [yearly, setYearly] = useState(false);
  const [plan, setPlan] = useState(0);
  const [region, setRegion] = useState(0);
  const [, usd, prefix, rate] = PREMIUM_REGIONS[region];

  const price = (mult: number) => {
    const dollars = usd * mult * (yearly ? 12 * 0.8 : 1);
    const local = dollars * rate;
    const shown = rate === 1 ? dollars.toFixed(2) : (local >= 100 ? Math.round(local / 10) * 10 : Math.round(local)).toLocaleString("en-US");
    return `${prefix}${shown}${yearly ? "/yr" : "/mo"}`;
  };

  return (
    <div className="mx-auto max-w-3xl">
      {isPremium && <p className="panel mb-5 p-4 text-[15px] text-primary">You are on Brisic Premium.</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)} className={`btn btn-sm ${!yearly ? "btn-primary" : "font-normal"}`}>Monthly</button>
        <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)} className={`btn btn-sm ${yearly ? "btn-primary" : "font-normal"}`}>Yearly · save 20%</button>
        <label className="ml-auto flex items-center gap-2 text-[13.5px] text-muted">
          Country
          <select value={region} onChange={(e) => setRegion(Number(e.target.value))} className="h-9 rounded-full border border-line bg-[#0b1a11] px-3 text-[14px] text-ink">
            {PREMIUM_REGIONS.map(([name], i) => <option key={name} value={i}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PREMIUM_PLANS.map((p, i) => (
          <button
            key={p.id} type="button" aria-pressed={plan === i} onClick={() => setPlan(i)}
            className={`rounded-[20px] border p-4 text-left ${plan === i ? "border-primary bg-primary/10" : "border-line bg-white/[0.03] hover:bg-white/[0.06]"}`}
          >
            <span className="flex items-baseline justify-between gap-3">
              <span className="text-[18px] font-semibold text-white">{p.name}</span>
              <span className="text-[16px] font-semibold text-primary">{price(p.mult)}</span>
            </span>
            <span className="mt-1 block text-[13.5px] font-light text-muted">{p.desc}</span>
          </button>
        ))}
      </div>

      <div className="panel mt-5 p-5">
        <h2 className="m-0 text-[17px] font-semibold text-white">What you get</h2>
        <ul className="m-0 mt-3 flex list-none flex-col gap-2.5 p-0">
          {PREMIUM_PERKS.map((k) => (
            <li key={k} className="flex items-center gap-2.5 text-[15px] text-ink"><Icon name="check" size={18} className="text-primary" /> {k}</li>
          ))}
        </ul>
      </div>

      <button type="button" className="btn btn-primary mt-5 w-full !h-[52px] text-[16px]" disabled>
        Get {PREMIUM_PLANS[plan].name} for {price(PREMIUM_PLANS[plan].mult)}
      </button>
      <p className="mt-3 text-center text-[12.5px] font-light text-muted">
        Checkout is not open yet. Prices shown are the planned launch prices and may change. No payment is taken.
      </p>
    </div>
  );
}
