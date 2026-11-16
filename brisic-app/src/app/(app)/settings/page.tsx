import { requireUser } from "@/lib/session";
import { readSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/account-clients";
import { BackButton } from "@/components/controls";
import { PageTitle } from "@/components/ui";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <div className="mx-auto max-w-3xl">
        <BackButton />
        <PageTitle title="Settings" subtitle="Make Brisic feel like yours" />
      </div>
      <SettingsForm initial={readSettings(user.settings)} />
    </>
  );
}
