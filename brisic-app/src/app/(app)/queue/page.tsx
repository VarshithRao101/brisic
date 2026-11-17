import { getUserId } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { QueueView } from "@/components/now-playing";
import { PageTitle } from "@/components/ui";

export default async function QueuePage() {
  await getUserId();
  return (
    <>
      <BackButton />
      <PageTitle title="Queue" subtitle="What plays next" />
      <QueueView />
    </>
  );
}
