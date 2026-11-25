// Stable links for uploaded files: /api/media/song/<id>, /cover/<songId>, /artist/<artistId>,
// /episode/<episodeId>. Signed-in users are redirected to a short-lived signed storage URL,
// so links saved in the player queue never expire.
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { downloadUrl } from "@/lib/storage";

async function keyFor(type: string, id: string): Promise<{ key: string; contentType?: string } | null> {
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
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in to listen", { status: 401 });
  const { type, id } = await params;
  const found = await keyFor(type, id.slice(0, 60));
  if (!found) return new Response("Not found", { status: 404 });
  try {
    const url = await downloadUrl(found.key, found.contentType);
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, max-age=1800" } });
  } catch {
    return new Response("Storage is not set up yet", { status: 503 });
  }
}
