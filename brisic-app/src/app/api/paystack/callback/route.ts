import { NextResponse, type NextRequest } from "next/server";
import { settle } from "@/lib/paystack";

/** Paystack sends the buyer back here after checkout (?reference=…). Confirms with Paystack, then shows /coins. */
export async function GET(req: NextRequest) {
  const reference = (req.nextUrl.searchParams.get("reference") || req.nextUrl.searchParams.get("trxref") || "").slice(0, 100);
  const r = reference ? await settle(reference).catch(() => ({ status: "pending" as const, kind: null })) : { status: "unknown" as const, kind: null };
  const paid = r.status === "success" ? "ok" : r.status;
  return NextResponse.redirect(new URL(`${r.kind === "PREMIUM" ? "/premium" : "/coins"}?paid=${paid}`, req.nextUrl.origin), 303);
}
