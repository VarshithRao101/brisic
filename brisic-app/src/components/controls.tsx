"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Track } from "@/lib/catalog/types";
import { Icon } from "@/components/icons";
import { useLibrary, usePlayer, useToast } from "@/components/app-state";
import { fetchStationTracks } from "@/app/actions";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} aria-label={label} title={label} className="mb-3 flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-primary/70 bg-black/30 p-0 text-ink hover:bg-white/10">
      <Icon name="back" size={18} />
    </button>
  );
}

export function FollowButton({ artistId, artistName, small }: { artistId: string; artistName: string; small?: boolean }) {
  const lib = useLibrary();
  const on = lib.followed.has(artistId);
  return (
    <button type="button" aria-pressed={on} onClick={() => lib.toggleFollow(artistId, artistName)} className={`btn ${small ? "btn-sm" : ""} ${on ? "" : "btn-primary"}`}>
      {on ? "Following" : "Follow"}
    </button>
  );
}

export function ShareButton({ title }: { title: string }) {
  const toast = useToast();
  return (
    <button
      type="button" className="btn"
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, url });
          else {
            await navigator.clipboard.writeText(url);
            toast("Link copied. Share it with friends.");
          }
        } catch {}
      }}
    >
      <Icon name="share" size={18} /> Share
    </button>
  );
}

/** Round ⋯ button beside Shuffle: Share, Support and Send a gift, like other music apps. */
export function MoreMenu({ title, artistId, artistName }: { title: string; artistId: string; artistName: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const item = "flex w-full items-center gap-3 border-0 bg-transparent px-4 py-3 text-left text-[14.5px] text-ink hover:bg-white/5";
  return (
    <div className="relative">
      <button type="button" aria-label="More options" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-11 w-11 items-center justify-center rounded-full border-[1.5px] border-primary/70 bg-black/30 text-white">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
      </button>
      {open && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-[70] cursor-default border-0 bg-black/60" onClick={() => setOpen(false)} />
          <div role="menu" aria-label={title} className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-w-lg rounded-t-3xl border border-b-0 border-line bg-card px-2 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 shadow-2xl">
            <span aria-hidden="true" className="mx-auto mb-2 block h-1 w-10 rounded-full bg-white/25" />
            <p className="m-0 truncate px-4 pb-2 text-[14px] font-semibold text-white">{title}</p>
            <button
              role="menuitem" type="button" className={item}
              onClick={async () => {
                setOpen(false);
                const url = location.href;
                try {
                  if (navigator.share) await navigator.share({ title, url });
                  else { await navigator.clipboard.writeText(url); toast("Link copied. Share it with friends."); }
                } catch { /* share sheet closed */ }
              }}
            >
              <Icon name="share" size={18} /> Share
            </button>
            <Link role="menuitem" href={`/artist/${artistId}/support`} className={item} onClick={() => setOpen(false)}>
              <Icon name="heart" size={18} /> Support {artistName}
            </Link>
            <Link role="menuitem" href={`/artist/${artistId}/gifts`} className={item} onClick={() => setOpen(false)}>
              <Icon name="gift" size={18} /> Send a gift
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/** Starts a radio station: loads its songs and plays them shuffled. */
export function StationButton({ stationId, children, className }: { stationId: string; children: React.ReactNode; className?: string }) {
  const p = usePlayer();
  const toast = useToast();
  return (
    <button
      type="button" className={className}
      onClick={async () => {
        const tracks = await fetchStationTracks(stationId).catch(() => [] as Track[]);
        if (!tracks.length) return toast("That station is not available right now.");
        p.playQueue([...tracks].sort(() => Math.random() - 0.5), 0);
      }}
    >
      {children}
    </button>
  );
}

export function SignOutButton({ className = "btn" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => { if (window.confirm("Log out of Brisic?")) signOut({ callbackUrl: "/login" }); }}>
      <Icon name="logout" size={18} /> Log out
    </button>
  );
}
