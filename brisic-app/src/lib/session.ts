import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setUpNewUser } from "@/lib/users";

const select = {
  id: true, name: true, email: true, image: true, username: true, bio: true,
  coins: true, isPremium: true, settings: true, passwordHash: true,
} as const;

/**
 * Signed-in user id from the session cookie — no database call. Redirects to /login when
 * signed out. Use it to start page queries right away, in parallel with requireUser().
 */
export const getUserId = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return id;
});

/** The signed-in user's profile row, or a redirect to /login. Cached per request. */
export const requireUser = cache(async () => {
  const id = await getUserId();

  let user = await prisma.user.findUnique({ where: { id }, select });
  // Session cookie for an account that no longer exists (e.g. deleted elsewhere).
  if (!user) redirect("/login?stale=1");

  if (!user.username) {
    await setUpNewUser(id);
    user = (await prisma.user.findUnique({ where: { id }, select })) ?? user;
  }
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    hasPassword: !!passwordHash,
    displayName: user.name || user.username || "Listener",
    handle: user.username || "listener",
  };
});

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>;

/** True when the visitor has a session for an account that still exists. */
export async function hasLiveSession() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;
  return !!(await prisma.user.findUnique({ where: { id }, select: { id: true } }));
}

/** User id for server actions. Throws when signed out. */
export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}
