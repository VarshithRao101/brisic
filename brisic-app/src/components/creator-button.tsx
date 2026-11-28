import Link from "next/link";
import { Icon } from "@/components/icons";

/** Shown only to approved creators: a clear way into the studio (it stays out of the listener tab bar). */
export function OpenStudioButton({ role }: { role: string }) {
  const artist = role === "artist";
  return (
    <Link href="/studio" className="panel-glow flex items-center gap-3.5 border border-primary/50 px-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-ink"><Icon name="mic" size={20} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] font-semibold text-white">Open {artist ? "Creator" : "Podcast"} Studio</span>
        <span className="block text-[13px] font-light text-ink/75">{artist ? "Upload songs and audio, add videos, go live" : "Upload episodes (audio or video), go live"}</span>
      </span>
      <Icon name="chevron" size={18} className="text-primary" />
    </Link>
  );
}
