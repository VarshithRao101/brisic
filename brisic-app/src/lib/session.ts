import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { setUpNewUser } from "@/lib/users";

const select = {
  id: true, name: true, email: true, image: true, username: true, bio: true,
  coins: true, isPremium: true, settings: true, passwordHash: true,
} as const;

/** The signed-in user, or a redirect to /login. Cached per request. */
export const requireUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");

  let user = await prisma.user.findUnique({ where: { id }, select });
  if (!user) redirect("/login");

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

/** User id for server actions. Throws when signed out. */
export async function requireUserId() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("Not signed in");
  return id;
}
