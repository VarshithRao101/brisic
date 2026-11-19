import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getUserId, requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { readSettings } from "@/lib/settings";
import { AppState } from "@/components/app-state";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await getUserId();
  // One parallel round trip: profile + everything the shell needs.
  const [user, likes, follows, playlists, unread] = await Promise.all([
    requireUser(),
    prisma.likedTrack.findMany({ where: { userId }, select: { trackId: true }, take: 5000 }),
    prisma.follow.findMany({ where: { userId }, select: { artistId: true }, take: 2000 }),
    prisma.userPlaylist.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true }, take: 200 }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  const settings = readSettings(user.settings);

  return (
    <AppState
      initial={{
        liked: likes.map((l) => l.trackId),
        followed: follows.map((f) => f.artistId),
        playlists,
        coins: user.coins,
      }}
    >
      <AppShell
        user={{ displayName: user.displayName, handle: user.handle, image: user.image, isPremium: user.isPremium }}
        unread={unread}
        playerColor={settings.playerColor}
        homeStyle={settings.homeStyle}
        sample={catalog.isSample}
      >
        {children}
      </AppShell>
    </AppState>
  );
}
