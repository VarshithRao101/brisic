import { NextResponse, type NextRequest } from "next/server";
import { confirmVerification } from "@/lib/verify-email";

/** The link in the "Confirm your email" message. */
export async function GET(req: NextRequest) {
  const token = (req.nextUrl.searchParams.get("token") ?? "").slice(0, 100);
  const ok = token ? await confirmVerification(token).catch(() => false) : false;
  return NextResponse.redirect(new URL(`/profile?verified=${ok ? "1" : "0"}`, req.nextUrl.origin), 303);
}
