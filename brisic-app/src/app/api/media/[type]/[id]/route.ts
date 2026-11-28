// Stable links for uploaded files: /api/media/song/<id>, /cover/<songId>, /artist/<artistId>,
// /episode/<episodeId>, /exclusive/<id> (unlocked fans and the artist only), /merch/<id>.
// Signed-in users are redirected to a short-lived signed storage URL, so links saved in the
// player queue never expire.
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/creators";
import { downloadUrl } from "@/lib/storage";

async function keyFor(type: string, id: string, userId: string): Promise<{ key: string; contentType?: string } | "locked" | null> {
  switch (type) {
    case "song": {
      const s = await prisma.song.findUnique({ where: { id }, select: { audioKey: true, audioType: true } });
      return s ? { key: s.audioKey, contentType: s.audioType } : null;
    }
    case "cover": {
      const s = await prisma.song.findUnique({ where: { id }, select: { coverKey: true } });
      return s?.coverKey ? { key: s.coverKey } : null;
    }
    case "artist": {
      const a = await prisma.artistProfile.findUnique({ where: { id }, select: { imageKey: true } });
      return a?.imageKey ? { key: a.imageKey } : null;
    }
    case "episode": {
      const e = await prisma.podcastEpisode.findUnique({ where: { id }, select: { audioKey: true, audioType: true } });
      return e?.audioKey ? { key: e.audioKey, contentType: e.audioType ?? undefined } : null;
    }
    case "merch": {
      const m = await prisma.merchItem.findUnique({ where: { id }, select: { imageKey: true } });
      return m?.imageKey ? { key: m.imageKey } : null;
    }
    case "exclusive": {
      const x = await prisma.exclusive.findUnique({ where: { id }, select: { audioKey: true, audioType: true, artist: { select: { userId: true } } } });
      if (!x?.audioKey) return null;
      if (x.artist.userId !== userId) {
        const [unlock, me] = await Promise.all([
          prisma.unlock.findUnique({ where: { userId_itemId: { userId, itemId: "ex:" + id } }, select: { id: true } }),
          prisma.user.findUnique({ where: { id: userId }, select: { email: true } }),
        ]);
        if (!unlock && !isAdminEmail(me?.email)) return "locked";
      }
      return { key: x.audioKey, contentType: x.audioType ?? undefined };
    }
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in to listen", { status: 401 });
  const { type, id } = await params;
  const found = await keyFor(type, id.slice(0, 60), session.user.id);
  if (found === "locked") return new Response("Unlock this exclusive first", { status: 403 });
  if (!found) return new Response("Not found", { status: 404 });
  try {
    const url = await downloadUrl(found.key, found.contentType);
    // Exclusive links must not be shared through caches.
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": type === "exclusive" ? "private, no-store" : "private, max-age=1800" } });
  } catch {
    return new Response("Storage is not set up yet", { status: 503 });
  }
}
