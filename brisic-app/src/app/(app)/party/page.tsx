import Link from "next/link";
import { getUserId } from "@/lib/session";
import { listLiveParties, myLiveParties } from "@/lib/party";
import { BackButton } from "@/components/controls";
import { Icon } from "@/components/icons";
import { PartyLobby } from "@/components/party-clients";
import { Section } from "@/components/ui";

export const metadata = { title: "Community Party · Brisic" };

export default async function PartyPage({ searchParams }: { searchParams: Promise<{ join?: string; name?: string }> }) {
  const userId = await getUserId();
  const [sp, live, mine] = await Promise.all([
    searchParams,
    listLiveParties(),
    myLiveParties(userId),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton />
      <h1 className="m-0 mb-1 text-[28px] font-bold text-white">Community <span className="text-primary">Party</span></h1>
      <p className="m-0 mb-4 text-[14px] font-light text-muted">Listen together, vote what plays next and chat with fans.</p>

      {mine.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {mine.map((room) => (
            <Link key={room.code} href={`/party/${room.code}`} className="panel-glow flex items-center gap-3 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-semibold text-white">{room.name}</span>
                <span className="block text-[12.5px] font-light text-ink/75">{room.isHost ? "You are hosting" : "You are in this party"} · {room.code}</span>
              </span>
              <span className="text-[13px] font-semibold text-primary">Return</span>
            </Link>
          ))}
        </div>
      )}

      <PartyLobby startJoin={sp.join === "1"} defaultName={(sp.name ?? "").slice(0, 60)} />

      <Section title="Live parties">
        {live.length === 0 ? (
          <p className="m-0 text-[14px] font-light text-muted">No public parties right now. Start one and share the code.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {live.map((r) => (
              <li key={r.code}>
                <Link href={`/party/${r.code}`} className="flex items-center gap-3 rounded-2xl border border-line px-3 py-3 transition hover:border-primary/60">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-primary text-primary"><Icon name="users" size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15.5px] text-white">{r.name}</span>
                    <span className="block truncate text-[12.5px] font-light text-muted">Hosted by {r.hostName} · {r.listening} listening</span>
                  </span>
                  <span className="btn btn-outline btn-sm">Join</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
