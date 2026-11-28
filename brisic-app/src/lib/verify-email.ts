// Email verification for email + password accounts (Google, Apple and Facebook already verify
// the address). Works once Resend is connected (RESEND_API_KEY + EMAIL_FROM); until then nothing is
// sent and nobody is asked to verify.

import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { emailEnabled, sendEmail, siteUrl } from "@/lib/email";

const HOURS = 24;
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const ident = (userId: string) => "verify:" + userId;

/** Emails a one-time verification link. Returns false when email is off or the user is done. */
export async function sendVerificationEmail(userId: string, requestHeaders?: Headers) {
  if (!emailEnabled()) return false;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true, emailVerified: true } });
  if (!user?.email || user.emailVerified) return false;
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier: ident(userId) } }),
    prisma.verificationToken.create({ data: { identifier: ident(userId), token: sha256(token), expires: new Date(Date.now() + HOURS * 3_600_000) } }),
  ]);
  const link = `${siteUrl(requestHeaders)}/api/verify-email?token=${token}`;
  const hello = user.name ? `Hi ${user.name.split(" ")[0]},` : "Hi,";
  return sendEmail({
    to: user.email,
    subject: "Confirm your email for Brisic",
    text: `${hello}\n\nConfirm this is your email so you can always get back into your Brisic account:\n${link}\n\nThe link works for ${HOURS} hours.`,
    html: `<p>${hello}</p><p>Confirm this is your email so you can always get back into your Brisic account:</p><p><a href="${link}">Confirm my email</a></p><p>The link works for ${HOURS} hours.</p>`,
  });
}

/** Marks the email as verified if the token is valid. Single use. */
export async function confirmVerification(token: string) {
  const row = await prisma.verificationToken.findUnique({ where: { token: sha256(token) } });
  if (!row || !row.identifier.startsWith("verify:")) return false;
  await prisma.verificationToken.delete({ where: { token: row.token } });
  if (row.expires < new Date()) return false;
  await prisma.user.update({ where: { id: row.identifier.slice("verify:".length) }, data: { emailVerified: new Date() } });
  return true;
}

/** True when this account should be asked to confirm its email. */
export async function needsVerification(userId: string) {
  if (!emailEnabled()) return false;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, emailVerified: true, passwordHash: true, accounts: { select: { id: true }, take: 1 } } });
  // Accounts made with Google / Apple / Facebook come with a checked email.
  return !!u?.email && !u.emailVerified && !!u.passwordHash && !u.accounts.length;
}
