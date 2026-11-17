import { auth } from "@/auth";
import { getPartyState, normalizeCode } from "@/lib/party";

export const dynamic = "force-dynamic";

/** Live room state, polled by the party screen every few seconds. */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "signed_out" }, { status: 401 });
  const code = normalizeCode((await params).code);
  if (!code) return Response.json({ error: "bad_code" }, { status: 400 });
  const state = await getPartyState(code, userId);
  if (!state) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(state, { headers: { "Cache-Control": "no-store" } });
}
