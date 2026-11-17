import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { BackButton, FollowButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { Empty, PageTitle } from "@/components/ui";

export default async function FollowingPage() {
  const userId = await getUserId();
  const follows = await prisma.follow.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <BackButton />
      <PageTitle title="Following" subtitle={`${follows.length} ${follows.length === 1 ? "artist" : "artists"} you follow`} />
      {follows.length === 0 ? (
        <Empty title="You are not following anyone yet" body="Follow artists to find them here." action={<Link href="/trending" className="btn btn-primary">See trending artists</Link>} />
      ) : (
        <ul className="m-0 list-none p-0">
          {follows.map((f) => (
            <li key={f.id} className="flex items-center gap-3.5 rounded-2xl px-2 py-2.5 hover:bg-white/5">
              <Link href={`/artist/${f.artistId}`} className="flex min-w-0 flex-1 items-center gap-3.5">
                <span className="w-14 shrink-0"><Cover seed={f.artistId} label={f.artistName} round textSize="text-base" /></span>
                <span className="truncate text-[16px] font-medium text-white">{f.artistName}</span>
              </Link>
              <FollowButton artistId={f.artistId} artistName={f.artistName} small />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
