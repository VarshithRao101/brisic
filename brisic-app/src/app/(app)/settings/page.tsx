import { requireUser } from "@/lib/session";
import { readSettings } from "@/lib/settings";
import { AccountSecurity, SettingsForm } from "@/components/account-clients";
import { BackButton } from "@/components/controls";
import { PageTitle } from "@/components/ui";
import { getAccess } from "@/lib/creators";
import { OpenStudioButton } from "@/components/creator-button";

export default async function SettingsPage() {
  const [user, access] = await Promise.all([requireUser(), getAccess()]);
  return (
    <>
      <div className="mx-auto max-w-3xl">
        <BackButton />
        <PageTitle title="Settings" subtitle="Make Brisic feel like yours" />
        {access.role && <div className="mb-5"><OpenStudioButton role={access.role} /></div>}
      </div>
      <SettingsForm initial={readSettings(user.settings)} />
      <AccountSecurity email={user.email} hasPassword={user.hasPassword} />
    </>
  );
}
