"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { updateProfile, updateSettings, type ProfileState } from "@/app/actions";
import { changePassword, deleteAccount, removeAvatar, uploadAvatar } from "@/app/account-actions";
import { HOME_STYLES, LANGUAGES, QUALITIES, THEMES, type Settings } from "@/lib/settings";
import { PREMIUM_PERKS, PREMIUM_PLANS, PREMIUM_REGIONS } from "@/lib/fan";
import { Icon } from "@/components/icons";
import { useToast } from "@/components/app-state";
import { PasswordRules } from "@/components/auth-forms";

/** Crops the picked image to a centered square and shrinks it to 256px JPEG in the browser. */
async function toAvatarDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx || !side) throw new Error("unreadable");
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 256, 256);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AvatarEditor({ image, initial }: { image: string | null; initial: string }) {
  const router = useRouter();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(image);
  const [busy, setBusy] = useState(false);

  return (
    <div className="mb-6 flex items-center gap-4">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Your profile photo" className="h-24 w-24 rounded-full border-2 border-line object-cover" />
      ) : (
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-[38px] font-semibold text-primary-ink">{initial}</span>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" className="sr-only" aria-label="Choose a profile photo"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > 15 * 1024 * 1024) return toast("That photo is too large. Pick one under 15 MB.");
            setBusy(true);
            try {
              const dataUrl = await toAvatarDataUrl(file);
              const r = await uploadAvatar(dataUrl);
              if (!r.ok) toast(r.error);
              else { setPreview(dataUrl); toast("Profile photo updated"); router.refresh(); }
            } catch {
              toast("Could not read that photo. Try a JPG or PNG.");
            }
            setBusy(false);
          }}
        />
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => input.current?.click()}>
          <Icon name="pencil" size={16} /> {busy ? "Uploading…" : preview ? "Change photo" : "Choose photo"}
        </button>
        {preview && (
          <button
            type="button" className="btn btn-sm" disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await removeAvatar().catch(() => null);
              setBusy(false);
              if (r?.ok) { setPreview(null); toast("Photo removed"); router.refresh(); } else toast("Could not remove the photo.");
            }}
          >
            <Icon name="trash" size={16} /> Remove
          </button>
        )}
      </div>
    </div>
  );
}

export function AccountSecurity({ email, hasPassword }: { email: string | null; hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [hadPassword, setHadPassword] = useState(hasPassword);

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent">Account</h2>
      <div className="panel p-4">
        <p className="m-0 text-[14px] text-muted">Signed in as <span className="text-ink">{email ?? "your account"}</span></p>
        <form
          className="mt-4 flex flex-col gap-2.5"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setMsg(null);
            const r = await changePassword(current, next).catch(() => null);
            setBusy(false);
            if (!r) return setMsg({ ok: false, text: "Something went wrong. Try again." });
            if (!r.ok) return setMsg({ ok: false, text: r.error });
            setMsg({ ok: true, text: r.message ?? "Saved." });
            setCurrent("");
            setNext("");
            setHadPassword(true);
          }}
        >
          <p className="m-0 text-[15.5px] font-medium text-ink">{hadPassword ? "Change password" : "Set a password"}</p>
          {!hadPassword && <p className="m-0 text-[13px] font-light text-muted">You sign in with Google. Add a password to also log in with your email.</p>}
          {hadPassword && (
            <input type="password" autoComplete="current-password" required aria-label="Current password" placeholder="Current password" className="field" value={current} onChange={(e) => setCurrent(e.target.value)} />
          )}
          <input type="password" autoComplete="new-password" required aria-label="New password" placeholder="New password" className="field" value={next} onChange={(e) => setNext(e.target.value)} maxLength={100} />
          {next && <PasswordRules password={next} />}
          {msg && <p role={msg.ok ? "status" : "alert"} className={`m-0 text-[14px] ${msg.ok ? "text-primary" : "text-[#ff9b9b]"}`}>{msg.text}</p>}
          <button className="btn btn-primary self-start" disabled={busy || !next}>{busy ? "Saving…" : hadPassword ? "Change password" : "Set password"}</button>
        </form>
      </div>

      <h2 className="mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#ff9b9b]">Delete account</h2>
      <div className="panel border-[#5a2a2a] p-4">
        <p className="m-0 text-[14px] font-light text-ink/90">
          This permanently deletes your profile, playlists, liked songs, follows, history and B-Coins. It cannot be undone.
        </p>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-[13.5px] text-muted">Type DELETE to confirm</span>
          <input className="field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoComplete="off" />
        </label>
        {deleteError && <p role="alert" className="m-0 mt-2 text-[14px] text-[#ff9b9b]">{deleteError}</p>}
        <button
          type="button" className="btn mt-3 border-[#8a3a3a] text-[#ffb3b3]" disabled={confirmText.trim() !== "DELETE" || deleting}
          onClick={async () => {
            setDeleting(true);
            setDeleteError("");
            const r = await deleteAccount(confirmText).catch(() => null);
            if (!r || !r.ok) {
              setDeleting(false);
              return setDeleteError(r && !r.ok ? r.error : "Could not delete the account. Try again.");
            }
            await signOut({ callbackUrl: "/login?deleted=1" });
          }}
        >
          <Icon name="trash" size={17} /> {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}

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
    // Show a new theme straight away; the server copy catches up on refresh.
    if (patch.theme) document.querySelector<HTMLElement>("[data-theme]")?.setAttribute("data-theme", patch.theme);
    if (patch.homeStyle) document.querySelector<HTMLElement>("[data-home]")?.setAttribute("data-home", patch.homeStyle);
    updateSettings(patch)
      .then(() => { if ("theme" in patch || "homeStyle" in patch) router.refresh(); })
      .catch(() => { setS(before); toast("Could not save. Check your connection."); });
  };
  const group = "panel divide-y divide-white/5 p-1";
  const heading = "mb-2 mt-7 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent first:mt-0";

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className={heading}>Theme</h2>
      <div className="panel-glow p-4">
        <p className="m-0 text-[13.5px] font-light text-ink/80">Pick the look of Brisic. It changes the colors across the whole app, including the player.</p>
        <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-4">
          {THEMES.map((t) => {
            const on = s.theme === t.id;
            return (
              <button
                key={t.id} type="button" aria-pressed={on}
                onClick={() => save({ theme: t.id })}
                className="flex flex-col items-center gap-2 border-0 bg-transparent p-0 text-[13px] text-ink"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-black sm:h-16 sm:w-16 ${on ? "outline outline-[3px] outline-offset-2 outline-white" : ""}`}
                  style={{ background: t.swatch, boxShadow: on ? "0 0 18px rgba(255,255,255,0.35)" : "0 0 6px rgba(0,0,0,0.6)" }}
                >
                  {on && <Icon name="check" size={22} />}
                </span>
                <span className={on ? "font-semibold text-white" : "text-muted"}>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <h2 className={heading}>Home style</h2>
      <p className="m-0 -mt-1 mb-2 text-[13px] font-light text-muted">How artists and playlists look on Home. You can change it any time.</p>
      <div className="grid grid-cols-2 gap-3">
        {HOME_STYLES.map((h) => {
          const on = s.homeStyle === h.id;
          const shaped = h.id === "shaped";
          return (
            <button
              key={h.id} type="button" aria-pressed={on} onClick={() => save({ homeStyle: h.id })}
              className={`flex flex-col items-center gap-2 rounded-2xl border-[1.5px] p-4 text-center transition ${on ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(var(--primary-rgb),0.25)]" : "border-line bg-white/[0.03]"}`}
            >
              <span className="flex gap-2" aria-hidden="true">
                {[0, 1].map((i) => (
                  <span
                    key={i} className="h-7 w-7 border-2 border-primary"
                    style={shaped ? { clipPath: "url(#bpick)", background: "var(--primary)", borderWidth: 0 } : { borderRadius: 999 }}
                  />
                ))}
              </span>
              <span className="flex gap-2" aria-hidden="true">
                <span className="h-8 w-9 bg-[#2f7a34]" style={{ borderRadius: shaped ? 12 : 8, transform: shaped ? "skewX(-6deg)" : undefined }} />
                <span className="h-8 w-9 bg-[#e8562a]" style={{ borderRadius: shaped ? 12 : 8, transform: shaped ? "skewX(-6deg)" : undefined }} />
              </span>
              <span className={`text-[15px] ${on ? "font-semibold text-white" : "text-ink"}`}>{h.name}</span>
              <span className="text-[12px] font-light text-muted">{h.blurb}</span>
            </button>
          );
        })}
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
