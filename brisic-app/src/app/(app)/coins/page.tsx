import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { COIN_PACKS } from "@/lib/fan";
import { fmtCoins, timeAgo } from "@/lib/format";
import { BackButton } from "@/components/controls";
import { PageTitle, Section } from "@/components/ui";

export default async function CoinsPage() {
  const userId = await getUserId();
  const [user, ledger] = await Promise.all([
    requireUser(),
    prisma.coinTransaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton />
      <PageTitle title="B-Coins" subtitle="Send gifts to artists and unlock exclusive content" />

      <div className="panel flex items-center gap-4 p-5">
        <Image src="/assets/coin.png" alt="" width={64} height={64} className="h-16 w-16 object-contain" />
        <div>
          <p className="m-0 text-[13.5px] font-light text-muted">Your balance</p>
          <p className="m-0 text-[34px] font-semibold leading-tight text-[#f2c94c]">{fmtCoins(user.coins)}</p>
        </div>
      </div>

      <Section title="Buy B-Coins">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {COIN_PACKS.map((p) => (
            <div key={p.coins} className="panel flex flex-col items-center gap-1 p-4 text-center opacity-70">
              <Image src="/assets/coin.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
              <p className="m-0 text-[17px] font-semibold text-white">{fmtCoins(p.coins)}</p>
              <p className="m-0 text-[12.5px] font-light text-muted">{p.metal} · ₦{fmtCoins(p.priceNaira)}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] font-light text-muted">
          Coin purchases open when payments go live. Until then, every new account starts with a welcome bonus.
        </p>
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
