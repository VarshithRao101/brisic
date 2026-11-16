import { prisma } from "@/lib/prisma";
import { WELCOME_BONUS } from "@/lib/fan";

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);

/** Picks a free username based on the email or name. */
async function freeUsername(base: string) {
  const root = clean(base) || "listener";
  for (let i = 0; i < 6; i++) {
    const candidate = i === 0 ? root : root + Math.floor(100 + Math.random() * 9900);
    const taken = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return root + Date.now().toString(36);
}

/**
 * First-time setup for an account: username, welcome B-Coins, welcome notification.
 * Safe to call more than once; it only fills in what is missing.
 */
export async function setUpNewUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, name: true },
  });
  if (!user) return;

  if (!user.username) {
    const username = await freeUsername(user.email?.split("@")[0] ?? user.name ?? "listener");
    await prisma.user.update({ where: { id: userId }, data: { username } }).catch(() => {});
  }

  const hasBonus = await prisma.coinTransaction.findFirst({ where: { userId, kind: "BONUS" }, select: { id: true } });
  if (!hasBonus) {
    await prisma.$transaction([
      prisma.coinTransaction.create({ data: { userId, amount: WELCOME_BONUS, kind: "BONUS", note: "Welcome bonus" } }),
      prisma.user.update({ where: { id: userId }, data: { coins: { increment: WELCOME_BONUS } } }),
      prisma.notification.create({
        data: {
          userId,
          title: "Welcome to Brisic",
          body: `You have ${WELCOME_BONUS} B-Coins to send gifts and unlock exclusive content.`,
          href: "/coins",
        },
      }),
    ]);
  }
}
