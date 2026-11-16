import { requireUser } from "@/lib/session";
import { BackButton } from "@/components/controls";
import { NowPlaying } from "@/components/now-playing";

export default async function PlayerPage() {
  await requireUser();
  return (
    <>
      <BackButton />
      <NowPlaying />
    </>
  );
}
