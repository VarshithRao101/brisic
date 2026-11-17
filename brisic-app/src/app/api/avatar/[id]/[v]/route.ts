import { prisma } from "@/lib/prisma";

/**
 * Serves an uploaded profile photo. The last path segment is a version stamp that
 * changes on every upload, so the response can be cached forever.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string; v: string }> }) {
  const { id } = await params;
  const avatar = await prisma.avatar.findUnique({ where: { userId: String(id).slice(0, 64) } });
  if (!avatar) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
