import Link from "next/link";
import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { fmtCount } from "@/lib/format";
import { BackButton, FollowButton } from "@/components/controls";
import { Cover } from "@/components/cover";
import { PageTitle } from "@/components/ui";

export default async function TrendingPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await getUserId();
  const period = (await searchParams).p === "month" ? "month" : "week";
  const artists = await catalog.getTrendingArtists(period);

  return (
    <>
      <BackButton />
      <PageTitle title="Trending Artists" subtitle={period === "week" ? "Most played this week" : "Most played this month"} />
      <div className="mb-4 flex gap-2">
        <Link href="/trending" className={`btn btn-sm ${period === "week" ? "btn-primary" : "font-normal"}`}>This week</Link>
        <Link href="/trending?p=month" className={`btn btn-sm ${period === "month" ? "btn-primary" : "font-normal"}`}>This month</Link>
      </div>
      <ol className="m-0 list-none p-0">
        {artists.map((a, i) => (
          <li key={a.id} className="flex items-center gap-3.5 rounded-2xl px-2 py-2.5 hover:bg-white/5">
            <span className={`w-7 shrink-0 text-center text-[17px] font-semibold tabular-nums ${i < 3 ? "text-primary" : "text-muted"}`}>{i + 1}</span>
            <Link href={`/artist/${a.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
              <span className="w-14 shrink-0"><Cover seed={a.id} label={a.name} src={a.image} round /></span>
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-medium text-white">{a.name}</span>
                <span className="block truncate text-[13px] font-light text-muted">{fmtCount(a.monthlyListeners)} monthly listeners · {a.genre}</span>
              </span>
            </Link>
            <FollowButton artistId={a.id} artistName={a.name} small />
          </li>
        ))}
      </ol>
    </>
  );
}
