import Image from "next/image";
import { requireUser } from "@/lib/session";
import { paystackEnabled, paystackTestMode, premiumPriceNaira } from "@/lib/paystack";
import { PremiumPlans } from "@/components/account-clients";
import { BackButton } from "@/components/controls";

const PAID: Record<string, [string, boolean]> = {
  ok: ["Payment received. Welcome to Brisic Premium!", true],
  pending: ["Paystack is still confirming your payment. Premium switches on as soon as it is confirmed.", true],
  failed: ["The payment did not go through, so Premium was not added. Try again.", false],
};

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ paid?: string }> }) {
  const user = await requireUser();
  const notice = PAID[(await searchParams).paid ?? ""];
  const until = user.isPremium && user.premiumUntil ? user.premiumUntil.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;
  return (
    <>
      <div className="mx-auto max-w-3xl">
        <BackButton />
        <div className="mb-6 flex items-center gap-4">
          <Image src="/assets/crown.png" alt="" width={64} height={64} className="h-16 w-16 object-contain" />
          <div>
            <h1 className="m-0 text-[28px] font-semibold text-white sm:text-[32px]">Brisic Premium</h1>
            <p className="m-0 mt-0.5 text-[15px] font-light text-muted">Listen without limits</p>
          </div>
        </div>
        {notice && (
          <p role="status" className={`m-0 mb-4 rounded-xl border px-4 py-3 text-[14px] ${notice[1] ? "border-primary/50 bg-primary/10 text-primary" : "border-[#ff9b9b]/50 bg-[#ff9b9b]/10 text-[#ff9b9b]"}`}>{notice[0]}</p>
        )}
      </div>
      <PremiumPlans isPremium={user.isPremium} until={until} payEnabled={paystackEnabled()} testMode={paystackTestMode()} nairaMonthly={premiumPriceNaira(false)} nairaYearly={premiumPriceNaira(true)} />
    </>
  );
}
