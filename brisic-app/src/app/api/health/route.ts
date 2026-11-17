import { prisma } from "@/lib/prisma";

/**
 * Tiny health check: one `SELECT 1`. Called every few minutes by the
 * netlify/functions/keep-warm scheduled function so the Neon database
 * (and this server function) stay awake during busy hours.
 */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up", ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, db: "down", ms: Date.now() - started }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
