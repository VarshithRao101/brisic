import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { PREMIUM_REGIONS } from "@/lib/fan";

/**
 * Paystack (Naira payments) for B-Coin bundles.
 * Set PAYSTACK_SECRET_KEY (sk_test_… while testing, sk_live_… for real money) in Netlify.
 * Coins are only added after Paystack itself confirms the payment (verify API), never from the browser.
 */
const API = "https://api.paystack.co";
const secret = () => process.env.PAYSTACK_SECRET_KEY ?? "";

export const paystackEnabled = () => secret().startsWith("sk_");
export const paystackTestMode = () => secret().startsWith("sk_test_");

/** Checkout channels Paystack offers, matched to the options on the Coins page. */
export const CHANNELS: Record<string, string[]> = {
  Card: ["card"],
  "Bank transfer": ["bank_transfer", "bank"],
  USSD: ["ussd"],
  "Mobile money": ["mobile_money"],
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(API + path, {
    ...init,
    headers: { Authorization: `Bearer ${secret()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const body = (await r.json().catch(() => null)) as { status?: boolean; message?: string; data?: unknown } | null;
  if (!r.ok || !body?.status) throw new Error(body?.message || `Paystack error ${r.status}`);
  return body.data as T;
}

export const newReference = () => "brs_" + Date.now().toString(36) + "_" + randomBytes(6).toString("hex");

/** Opens a Paystack checkout and returns the page to send the user to. */
export async function initialize(input: { email: string; amountKobo: number; reference: string; callbackUrl: string; channels?: string[]; metadata?: object }) {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: input.channels,
      metadata: input.metadata,
    }),
  });
  return data.authorization_url;
}

/** True when the webhook body really came from Paystack (HMAC SHA-512 with the secret key). */
export function validSignature(rawBody: string, signature: string | null) {
  if (!signature || !paystackEnabled()) return false;
  const expected = createHmac("sha512", secret()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Naira price of Brisic Premium (Individual), from the Nigeria row of the price table. */
export function premiumPriceNaira(yearly: boolean) {
  const ng = PREMIUM_REGIONS.find((r) => r[0] === "Nigeria")!;
  const naira = ng[1] * (yearly ? 12 * 0.8 : 1) * ng[3];
  return Math.round(naira / 10) * 10;
}

type Settled = "success" | "pending" | "failed" | "unknown";

/**
 * Asks Paystack for the payment's real status and, the first time it is successful with the right
 * amount and currency, delivers it (coins or Premium). Safe to call many times (the return page
 * and the webhook both do).
 */
export async function settle(reference: string): Promise<{ status: Settled; kind: string | null }> {
  const r = await settleInner(reference);
  const p = await prisma.payment.findUnique({ where: { reference }, select: { kind: true } });
  return { status: r, kind: p?.kind ?? null };
}

async function settleInner(reference: string): Promise<Settled> {
  const payment = await prisma.payment.findUnique({ where: { reference } });
  if (!payment) return "unknown";
  if (payment.status === "success") return "success";

  const tx = await call<{ status: string; amount: number; currency: string; channel?: string; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  ).catch(() => null);
  if (!tx) return "pending";

  if (tx.status !== "success") {
    if (["failed", "abandoned", "reversed"].includes(tx.status)) {
      await prisma.payment.updateMany({ where: { reference, status: "pending" }, data: { status: "failed", channel: tx.channel ?? null } });
      return "failed";
    }
    return "pending";
  }
  if (tx.amount !== payment.amountKobo || tx.currency !== "NGN") {
    await prisma.payment.updateMany({ where: { reference, status: "pending" }, data: { status: "failed", channel: tx.channel ?? null } });
    return "failed";
  }

  await prisma.$transaction(async (db) => {
    // Only the first caller flips pending → success, so coins are never added twice.
    const flipped = await db.payment.updateMany({
      where: { reference, status: { not: "success" } },
      data: { status: "success", paidAt: new Date(), channel: tx.channel ?? null },
    });
    if (flipped.count !== 1) return;
    const naira = `₦${(payment.amountKobo / 100).toLocaleString("en-US")}`;
    if (payment.kind === "PREMIUM") {
      const u = await db.user.findUnique({ where: { id: payment.userId }, select: { premiumUntil: true } });
      const from = u?.premiumUntil && u.premiumUntil > new Date() ? u.premiumUntil : new Date();
      const until = new Date(from);
      until.setMonth(until.getMonth() + Math.max(1, payment.months));
      await db.user.update({ where: { id: payment.userId }, data: { isPremium: true, premiumUntil: until } });
      await db.notification.create({
        data: { userId: payment.userId, title: "Welcome to Brisic Premium", body: `Paid ${naira}. Premium runs until ${until.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`, href: "/premium" },
      });
      return;
    }
    await db.user.update({ where: { id: payment.userId }, data: { coins: { increment: payment.coins } } });
    await db.coinTransaction.create({
      data: { userId: payment.userId, amount: payment.coins, kind: "PURCHASE", note: `Bought ${payment.coins.toLocaleString("en-US")} B-Coins (${naira}, Paystack)` },
    });
    await db.notification.create({ data: { userId: payment.userId, title: "B-Coins added", body: `${payment.coins.toLocaleString("en-US")} B-Coins are in your balance (${naira}).`, href: "/coins" } });
  });
  return "success";
}
