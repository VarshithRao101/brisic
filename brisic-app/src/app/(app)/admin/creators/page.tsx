import { prisma } from "@/lib/prisma";
import { MUSIC_GENRES } from "@/lib/catalog/genres";
import { AdminCreators } from "@/components/studio-clients";

export default async function AdminCreatorsPage() {
  const creators = await prisma.user.findMany({
    where: { creatorRole: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, name: true, username: true, email: true, creatorRole: true,
      artistProfile: { select: { id: true, name: true, _count: { select: { songs: true, videos: true } } } },
      _count: { select: { podcastShows: true } },
    },
  });
  return (
    <AdminCreators
      genres={MUSIC_GENRES}
      creators={creators.map((c) => ({
        id: c.id, name: c.artistProfile?.name || c.name || c.username || "Creator", email: c.email ?? "",
        role: c.creatorRole ?? "", artistId: c.artistProfile?.id ?? null,
        stats: c.artistProfile ? `${c.artistProfile._count.songs} songs · ${c.artistProfile._count.videos} videos` : `${c._count.podcastShows} shows`,
      }))}
    />
  );
}
