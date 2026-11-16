"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Track } from "@/lib/catalog/types";
import { Icon } from "@/components/icons";
import { useLibrary, usePlayer, useToast } from "@/components/app-state";
import { fetchStationTracks } from "@/app/actions";

export function BackButton({ label = "Back" }: { label?: string }) {
  const router = useRouter();
  return (
    <button type="button" onClick={() => router.back()} className="mb-3 inline-flex items-center gap-1 border-0 bg-transparent p-0 text-[14px] text-muted hover:text-ink">
      <Icon name="back" size={18} /> {label}
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
