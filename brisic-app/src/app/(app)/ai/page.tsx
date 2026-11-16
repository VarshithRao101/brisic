import { requireUser } from "@/lib/session";
import { AIChat } from "@/components/fan-clients";
import { PageTitle } from "@/components/ui";

export default async function AIPage() {
  await requireUser();
  return (
    <>
      <div className="mx-auto max-w-3xl">
        <PageTitle title="Brisic AI" subtitle="Ask for music by genre, mood or artist" />
      </div>
      <AIChat />
    </>
  );
}
