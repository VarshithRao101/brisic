import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { COIN_PACKS } from "@/lib/fan";
import { paystackEnabled, paystackTestMode } from "@/lib/paystack";
import { fmtCoins, timeAgo } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { CoinShop } from "@/components/fan-clients";
import { GiftIcon } from "@/components/gift-icons";
import { PageTitle, Section } from "@/components/ui";

const PAID: Record<string, [string, boolean]> = {
  ok: ["Payment received. Your B-Coins have been added.", true],
  pending: ["Paystack is still confirming your payment. Your coins appear here as soon as it is confirmed.", true],
  failed: ["The payment did not go through, so no coins were added. Try again.", false],
};

export default async function CoinsPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const userId = await getUserId();
  const notice = PAID[(await searchParams).paid ?? ""];
  const [user, ledger] = await Promise.all([
    requireUser(),
    prisma.coinTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="B-Coins" subtitle="Send gifts to artists and unlock exclusive content" />

      {notice && (
        <p role="status" className={`m-0 mb-4 rounded-xl border px-4 py-3 text-[14px] ${notice[1] ? "border-primary/50 bg-primary/10 text-primary" : "border-[#ff9b9b]/50 bg-[#ff9b9b]/10 text-[#ff9b9b]"}`}>{notice[0]}</p>
      )}
      <div className="panel-glow flex items-center gap-4 p-5">
        <Image src="/assets/coin.png" alt="" width={64} height={64} className="h-16 w-16 object-contain drop-shadow-[0_0_14px_rgba(242,201,76,0.5)]" />
        <div className="min-w-0 flex-1">
          <p className="m-0 text-[13.5px] font-light text-ink/80">Your balance</p>
          <p className="m-0 text-[34px] font-bold leading-tight text-white">{fmtCoins(user.coins)}</p>
        </div>
        <div className="hidden gap-1.5 text-primary sm:flex" aria-hidden="true">
          {["mic", "crown", "car", "studio", "universe"].map((g) => <GiftIcon key={g} id={g} size={26} />)}
        </div>
      </div>

      <Section title="Top up B-Coins">
        <p className="m-0 -mt-1 mb-3 text-[13.5px] font-light text-muted">1 B-Coin = ₦1. Bundles from ₦100 to ₦250,000, paid in Naira with Paystack.</p>
        <CoinShop packs={COIN_PACKS} payEnabled={paystackEnabled()} testMode={paystackTestMode()} />
      </Section>

      <Section title="Coin history">
        {ledger.length === 0 ? (
          <p className="text-sm font-light text-muted">No coin activity yet.</p>
        ) : (
          <ul className="panel m-0 list-none divide-y divide-white/5 p-1">
            {ledger.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] text-ink">{t.note}</span>
                  <span className="block text-[12.5px] font-light text-muted">{timeAgo(t.createdAt)}</span>
                </span>
                <span className={`shrink-0 text-[15.5px] font-semibold tabular-nums ${t.amount >= 0 ? "text-primary" : "text-[#ff9b9b]"}`}>
                  {t.amount >= 0 ? "+" : "−"}{fmtCoins(Math.abs(t.amount))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
