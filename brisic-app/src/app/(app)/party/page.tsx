import Link from "next/link";
import { getUserId } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { Icon } from "@/components/icons";

const STEPS = [
  ["Start a room", "Pick a playlist and open a party. Share the invite link with friends."],
  ["Vote for what plays next", "Everyone in the room adds songs and votes. The top song plays next."],
  ["Chat while you listen", "Talk in the room chat, and send the host or the artist a gift."],
] as const;

export default async function PartyPage() {
  await getUserId();
  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <div className="panel overflow-hidden">
        <div className="bg-[linear-gradient(135deg,#7a2a8a,#0b1a11_70%)] p-6 sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.12em] text-white">Coming soon</span>
          <h1 className="m-0 mt-3 text-[30px] font-semibold leading-tight text-white sm:text-[38px]">Community Party</h1>
          <p className="m-0 mt-2 max-w-xl text-[15.5px] font-light text-white/85">Listen to the same song at the same time with friends, wherever they are.</p>
        </div>
        <ol className="m-0 flex list-none flex-col gap-4 p-6 sm:p-8">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[15px] font-semibold text-primary">{i + 1}</span>
              <span>
                <span className="block text-[16px] font-semibold text-white">{title}</span>
                <span className="block text-[14px] font-light text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-[13.5px] font-light text-muted">
        Live rooms need real-time audio sync, which arrives after the music catalog is connected. Until then you can build the playlist you will party with.
      </p>
      <Link href="/library" className="btn mt-3"><Icon name="library" size={18} /> Go to your playlists</Link>
    </div>
  );
}
