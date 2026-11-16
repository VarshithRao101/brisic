import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { Grid, PageTitle, ShowCard } from "@/components/ui";

export default async function ShowsPage() {
  await requireUser();
  const shows = await catalog.getShows();
  return (
    <>
      <BackButton />
      <PageTitle title="Podcasts" subtitle="Video and audio shows about the music" />
      <Grid>{shows.map((s) => <ShowCard key={s.id} s={s} fluid />)}</Grid>
    </>
  );
}
