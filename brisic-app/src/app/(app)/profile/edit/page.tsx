import { requireUser } from "@/lib/session";
import { EditProfileForm } from "@/components/account-clients";
import { BackButton } from "@/components/controls";
import { PageTitle } from "@/components/ui";

export default async function EditProfilePage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-xl">
      <BackButton />
      <PageTitle title="Edit Profile" subtitle="Make it yours" />
      <EditProfileForm name={user.name ?? ""} username={user.handle} bio={user.bio ?? ""} />
      <p className="mt-5 text-[12.5px] font-light text-muted">
        Your photo comes from your Google account. Uploading a custom photo will be added with file storage.
      </p>
    </div>
  );
}
