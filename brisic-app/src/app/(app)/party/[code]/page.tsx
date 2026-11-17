import { notFound, redirect } from "next/navigation";
import { getUserId } from "@/lib/session";
import { getPartyState, normalizeCode } from "@/lib/party";
import { PartyRoom } from "@/components/party-clients";

export const metadata = { title: "Party · Brisic" };

export default async function PartyRoomPage({ params }: { params: Promise<{ code: string }> }) {
  const userId = await getUserId();
  const raw = (await params).code;
  const code = normalizeCode(raw);
  if (!code) notFound();
  if (code !== raw) redirect(`/party/${code}`);
  const state = await getPartyState(code, userId);
  if (!state) notFound();
  return <PartyRoom initial={state} />;
}
