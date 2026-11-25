// Who can manage Brisic content.
// Admins: emails listed in ADMIN_EMAILS (comma separated). They invite creators.
// Creators: users with creatorRole "artist" or "podcaster" (invite-only).

import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";

export type CreatorRole = "artist" | "podcaster";
export const CREATOR_ROLES: CreatorRole[] = ["artist", "podcaster"];

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export const isAdminEmail = (email: string | null | undefined) => !!email && adminEmails().includes(email.toLowerCase());

/** The signed-in user's role info, cached per request. */
export const getAccess = cache(async () => {
  const userId = await getUserId();
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, username: true, creatorRole: true, artistProfile: { select: { id: true } } },
  });
  if (!u) redirect("/login?stale=1");
  return {
    userId: u.id,
    isAdmin: isAdminEmail(u.email),
    role: (u.creatorRole === "artist" || u.creatorRole === "podcaster" ? u.creatorRole : null) as CreatorRole | null,
    artistId: u.artistProfile?.id ?? null,
    displayName: u.name || u.username || "Creator",
  };
});

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "creator";
