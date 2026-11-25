import { youtubeEmbed } from "@/lib/youtube";

/**
 * YouTube video or live stream inside Brisic. playsinline=1 keeps phones in the app and
 * rel=0 stops outside channels being suggested at the end.
 */
export function YouTubePlayer({ id, title, live, autoplay }: { id: string; title: string; live?: boolean; autoplay?: boolean }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <iframe
        src={youtubeEmbed(id, autoplay)}
        title={title}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
      {live && (
        <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-[#e02a2a] px-2 py-0.5 text-[11px] font-bold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
        </span>
      )}
    </div>
  );
}
