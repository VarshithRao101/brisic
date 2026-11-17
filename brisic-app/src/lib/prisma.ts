import { PrismaClient } from "@prisma/client";

const serverless = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);

/**
 * On serverless hosts every instance opens its own connections, so:
 * - always go through Neon's connection pooler (the "-pooler" host), and
 * - keep a small per-instance pool, letting the pooler multiplex.
 * Locally the URL is used as-is (the direct connection is faster from far away).
 */
function databaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || !serverless) return raw;
  try {
    const url = new URL(raw);
    if (url.hostname.endsWith(".neon.tech")) {
      const [endpoint, ...rest] = url.hostname.split(".");
      if (!endpoint.endsWith("-pooler")) url.hostname = [endpoint + "-pooler", ...rest].join(".");
      url.searchParams.set("pgbouncer", "true");
      url.searchParams.delete("channel_binding");
    }
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "5");
    if (!url.searchParams.has("pool_timeout")) url.searchParams.set("pool_timeout", "15");
    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Reuse one client per server instance (also survives hot reload in dev).
globalForPrisma.prisma = prisma;
