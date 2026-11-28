import { NextResponse } from "next/server";
import { settle, validSignature } from "@/lib/paystack";

/**
 * Paystack webhook (Paystack Dashboard → Settings → API Keys & Webhooks → Webhook URL:
 * https://brisic.netlify.app/api/paystack/webhook). Catches payments even when the buyer closes
 * the tab before returning. The signature is checked, and the payment is re-confirmed with Paystack.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-paystack-signature"))) return new NextResponse("Bad signature", { status: 401 });
  let event: { event?: string; data?: { reference?: string } } = {};
  try { event = JSON.parse(raw); } catch { return new NextResponse("Bad body", { status: 400 }); }
  const reference = String(event.data?.reference ?? "").slice(0, 100);
  if (reference && (event.event === "charge.success" || event.event === "charge.failed")) await settle(reference).catch(() => null);
  return NextResponse.json({ received: true });
}
