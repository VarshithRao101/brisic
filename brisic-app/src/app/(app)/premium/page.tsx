import Image from "next/image";
import { requireUser } from "@/lib/session";
import { PremiumPlans } from "@/components/account-clients";
import { BackButton } from "@/components/controls";

export default async function PremiumPage() {
  const user = await requireUser();
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
      </div>
      <PremiumPlans isPremium={user.isPremium} />
    </>
  );
}
