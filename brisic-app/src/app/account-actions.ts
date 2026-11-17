"use server";

import { createHash, randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { passwordProblem } from "@/lib/password";
import { clientIp, hit, waitText } from "@/lib/rate-limit";
import { emailEnabled, sendEmail, siteUrl } from "@/lib/email";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// ---------- Password: change or set ----------

export async function changePassword(current: string, next: string): Promise<Result> {
  const userId = await requireUserId();
  const lim = await hit("pwchange:" + userId, 5, 900);
  if (!lim.ok) return { ok: false, error: `Too many attempts. Try again in ${waitText(lim.retryAfterSec)}.` };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  if (!user) return { ok: false, error: "Account not found." };
  if (user.passwordHash && !(await bcrypt.compare(String(current ?? ""), user.passwordHash))) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  const problem = passwordProblem(String(next ?? ""));
  if (problem) return { ok: false, error: problem };

  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(String(next), 12) } });
  await prisma.passwordResetToken.deleteMany({ where: { userId } });
  return { ok: true, message: user.passwordHash ? "Password changed." : "Password set. You can now also log in with your email." };
}

// ---------- Delete account ----------

export async function deleteAccount(confirmText: string): Promise<Result> {
  const userId = await requireUserId();
  if (String(confirmText ?? "").trim() !== "DELETE") return { ok: false, error: "Type DELETE to confirm." };
  // Everything that belongs to the user (likes, playlists, coins, sessions...) is removed by cascade.
  await prisma.user.delete({ where: { id: userId } }).catch(() => null);
  return { ok: true };
}

// ---------- Profile photo ----------

const MAX_AVATAR_BYTES = 300 * 1024;

function imageType(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length > 12 && buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

/** Saves a photo the browser already resized; accepts a data: URL. */
export async function uploadAvatar(dataUrl: string): Promise<Result> {
  const userId = await requireUserId();
  const lim = await hit("avatar:" + userId, 10, 3600);
  if (!lim.ok) return { ok: false, error: `Too many uploads. Try again in ${waitText(lim.retryAfterSec)}.` };

  const m = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl ?? ""));
  if (!m) return { ok: false, error: "That file is not a supported image." };
  const data = Buffer.from(m[1], "base64");
  if (data.length > MAX_AVATAR_BYTES) return { ok: false, error: "That photo is too large." };
  const mime = imageType(data);
  if (!mime) return { ok: false, error: "That file is not a supported image." };

  await prisma.avatar.upsert({ where: { userId }, create: { userId, mime, data }, update: { mime, data } });
  await prisma.user.update({ where: { id: userId }, data: { image: `/api/avatar/${userId}/${Date.now().toString(36)}` } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeAvatar(): Promise<Result> {
  const userId = await requireUserId();
  await prisma.avatar.deleteMany({ where: { userId } });
  await prisma.user.update({ where: { id: userId }, data: { image: null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

// ---------- Password reset by email ----------

const RESET_MINUTES = 30;

export async function requestPasswordReset(emailInput: string): Promise<Result> {
  const generic: Result = { ok: true, message: "If an account exists for that email, we sent a link to reset the password. It works for 30 minutes." };
  if (!emailEnabled()) return { ok: false, error: "Password reset is not available yet." };

  const email = String(emailInput ?? "").trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email." };

  const [byEmail, byIp] = await Promise.all([hit("reset:email:" + email, 3, 3600), hit("reset:ip:" + (await clientIp()), 10, 3600)]);
  if (!byEmail.ok || !byIp.ok) return generic; // stay vague; do not reveal anything

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });
  if (!user) return generic;

  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_MINUTES * 60_000) },
    }),
  ]);
  const link = `${siteUrl(await headers())}/reset-password?token=${token}`;
  const hello = user.name ? `Hi ${user.name.split(" ")[0]},` : "Hi,";
  await sendEmail({
    to: email,
    subject: "Reset your Brisic password",
    text: `${hello}\n\nUse this link to choose a new Brisic password. It works for ${RESET_MINUTES} minutes:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
    html: `<p>${hello}</p><p>Use this link to choose a new Brisic password. It works for ${RESET_MINUTES} minutes:</p><p><a href="${link}">Reset my password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
  });
  return generic;
}

export async function resetPassword(token: string, password: string): Promise<Result> {
  const lim = await hit("resetuse:ip:" + (await clientIp()), 20, 3600);
  if (!lim.ok) return { ok: false, error: `Too many attempts. Try again in ${waitText(lim.retryAfterSec)}.` };

  const row = await prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(String(token ?? "")) } });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is invalid or has expired. Ask for a new one." };
  }
  const problem = passwordProblem(String(password ?? ""));
  if (problem) return { ok: false, error: problem };

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(String(password), 12) } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
  ]);
  return { ok: true, message: "Your password was changed. You can log in now." };
}
