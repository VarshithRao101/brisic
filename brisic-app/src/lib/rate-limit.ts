import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export type Limit = { ok: boolean; retryAfterSec: number };

/**
 * Fixed-window rate limit stored in Postgres, so it works across every serverless
 * instance. One atomic upsert per call: count this attempt and report whether the
 * key is still under `limit` within `windowSec`.
 */
export async function hit(key: string, limit: number, windowSec: number): Promise<Limit> {
  try {
    const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, timezone('utc', now()) + ${windowSec} * interval '1 second')
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now()) THEN 1 ELSE "RateLimit"."count" + 1 END,
        "resetAt" = CASE WHEN "RateLimit"."resetAt" <= timezone('utc', now())
                         THEN timezone('utc', now()) + ${windowSec} * interval '1 second'
                         ELSE "RateLimit"."resetAt" END
      RETURNING "count", "resetAt"`;
    // Occasionally clear out windows that expired over an hour ago.
    if (Math.random() < 0.02) {
      prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 3_600_000) } } }).catch(() => {});
    }
    const row = rows[0];
    const count = Number(row?.count ?? 0);
    const retryAfterSec = row ? Math.max(1, Math.ceil((new Date(row.resetAt).getTime() - Date.now()) / 1000)) : 0;
    return { ok: count <= limit, retryAfterSec };
  } catch {
    // Never lock people out because the limiter itself failed.
    return { ok: true, retryAfterSec: 0 };
  }
}

/** Best-effort client IP from the proxy headers Netlify/Vercel set. */
export function ipFrom(h: Headers): string {
  return (
    h.get("x-nf-client-connection-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown"
  );
}

/** Client IP inside server actions and server components. */
export async function clientIp(): Promise<string> {
  return ipFrom(await headers());
}

export const waitText = (sec: number) => (sec >= 90 ? `${Math.ceil(sec / 60)} minutes` : `${sec} seconds`);
