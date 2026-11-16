import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { playerHex, readSettings } from "@/lib/settings";
import { AppState } from "@/components/app-state";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const [likes, follows, playlists, unread] = await Promise.all([
    prisma.likedTrack.findMany({ where: { userId: user.id }, select: { trackId: true } }),
    prisma.follow.findMany({ where: { userId: user.id }, select: { artistId: true } }),
    prisma.userPlaylist.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

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
        playerColor={playerHex(readSettings(user.settings).playerColor)}
        sample={catalog.isSample}
      >
        {children}
      </AppShell>
    </AppState>
  );
}
