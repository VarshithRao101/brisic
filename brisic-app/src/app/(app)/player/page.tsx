import { getUserId } from "@/lib/session";
import { NowPlaying } from "@/components/now-playing";

export const metadata = { title: "Now Playing · Brisic" };

/** Full-screen player. The app shell hides the header, tabs and mini player on this route. */
export default async function PlayerPage() {
  await getUserId();
  return <NowPlaying />;
}
