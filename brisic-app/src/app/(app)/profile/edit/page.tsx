import { requireUser } from "@/lib/session";
import { AvatarEditor, EditProfileForm } from "@/components/account-clients";
import { BackButton } from "@/components/controls";
import { PageTitle } from "@/components/ui";

export default async function EditProfilePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <BackButton />
      <PageTitle title="Edit Profile" subtitle="Make it yours" />
      <AvatarEditor image={user.image} initial={user.displayName[0]?.toUpperCase() ?? "B"} />
      <EditProfileForm name={user.name ?? ""} username={user.handle} bio={user.bio ?? ""} />
    </div>
  );
}
