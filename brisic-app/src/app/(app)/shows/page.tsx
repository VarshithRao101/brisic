import { getUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { Empty, Grid, PageTitle, ShowCard } from "@/components/ui";

export default async function ShowsPage() {
  await getUserId();
  const shows = await catalog.getShows();
  return (
    <>
      <BackButton />
      <PageTitle title="Podcasts" subtitle="Video and audio shows about the music" />
      {shows.length ? <Grid>{shows.map((s) => <ShowCard key={s.id} s={s} fluid />)}</Grid> : <Empty title="No podcasts yet" body="Brisic podcasters are recording now. Shows appear here as soon as the first episode is out." />}
    </>
  );
}
