import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAccess } from "@/lib/creators";
import { storageMode } from "@/lib/storage";
import { youtubeUploadEnabled } from "@/lib/youtube";
import { BackButton } from "@/components/controls";
import { AdminCreators } from "@/components/studio-clients";

export const metadata = { title: "Admin · Brisic" };

export default async function AdminPage() {
  const access = await getAccess();
  if (!access.isAdmin) notFound();
  const creators = await prisma.user.findMany({
    where: { creatorRole: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, username: true, email: true, creatorRole: true, artistProfile: { select: { id: true, name: true } } },
  });
  const storage = storageMode();

  return (
    <div className="mx-auto max-w-2xl">
      <BackButton />
      <h1 className="m-0 text-[28px] font-bold text-white">Brisic <span className="text-primary">Admin</span></h1>
      <p className="m-0 mb-4 text-[14px] font-light text-muted">Creators are invite-only. Open the studio for your artists and podcasters here.</p>
      <div className="panel mb-5 grid gap-1 p-3 text-[13.5px]">
        <p className="m-0">File storage (songs and podcast audio): <b className={storage === "neon" ? "text-primary" : "text-[#ffcf87]"}>{storage === "neon" ? "Neon storage connected" : storage === "local" ? "this computer (development)" : "not connected"}</b></p>
        <p className="m-0">YouTube direct upload: <b className={youtubeUploadEnabled() ? "text-primary" : "text-[#ffcf87]"}>{youtubeUploadEnabled() ? "connected (unlisted uploads)" : "off: creators paste YouTube links"}</b></p>
      </div>
      <AdminCreators
        creators={creators.map((c) => ({
          id: c.id, name: c.artistProfile?.name || c.name || c.username || "Creator", email: c.email ?? "",
          role: c.creatorRole ?? "", artistId: c.artistProfile?.id ?? null,
        }))}
      />
    </div>
  );
}
