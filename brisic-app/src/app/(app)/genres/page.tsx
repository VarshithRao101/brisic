import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { BackButton } from "@/components/controls";
import { GenreTile, PageTitle, Section } from "@/components/ui";

const GROUPS = [
  ["music", "Music genres"],
  ["podcasts", "Podcasts & audio"],
  ["moods", "Moods & moments"],
] as const;

export default async function GenresPage() {
  await requireUser();
  const genres = await catalog.getGenres();
  return (
    <>
      <BackButton />
      <PageTitle title="Genres" subtitle="Find music by sound, show or mood" />
      {GROUPS.map(([group, title]) => (
        <Section key={group} title={title}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {genres.filter((g) => g.group === group).map((g) => <GenreTile key={g.id} id={g.id} name={g.name} />)}
          </div>
        </Section>
      ))}
    </>
  );
}
