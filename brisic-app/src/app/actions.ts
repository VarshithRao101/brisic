"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { setUpNewUser } from "@/lib/users";
import { catalog } from "@/lib/catalog";
import { COIN_PACKS, GIFTS } from "@/lib/fan";
import { CHANNELS, initialize, newReference, paystackEnabled, premiumPriceNaira } from "@/lib/paystack";
import { readSettings, type Settings } from "@/lib/settings";
import { clientIp, hit, waitText } from "@/lib/rate-limit";
import { passwordProblem } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/verify-email";

export type TrackSnap = { id: string; title: string; artistId: string; artistName: string; durationSec: number };
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const snap = (t: TrackSnap) => ({
  trackId: str(t.id, 200),
  title: str(t.title, 200),
  artistId: str(t.artistId, 200),
  artistName: str(t.artistName, 200),
  durationSec: Math.max(0, Math.min(36_000, Math.round(Number(t.durationSec) || 0))),
});
const refresh = () => revalidatePath("/", "layout");

// ---------- Library ----------

export async function setLiked(track: TrackSnap, liked: boolean) {
  const userId = await requireUserId();
  const s = snap(track);
  if (!s.trackId) return;
  if (liked) {
    await prisma.likedTrack.upsert({
      where: { userId_trackId: { userId, trackId: s.trackId } },
      create: { userId, ...s },
      update: {},
    });
  } else {
    await prisma.likedTrack.deleteMany({ where: { userId, trackId: s.trackId } });
  }
  refresh();
}

export async function setFollowing(artistId: string, artistName: string, following: boolean) {
  const userId = await requireUserId();
  const id = str(artistId, 200);
  if (!id) return;
  if (following) {
    await prisma.follow.upsert({
      where: { userId_artistId: { userId, artistId: id } },
      create: { userId, artistId: id, artistName: str(artistName, 200) },
      update: {},
    });
  } else {
    await prisma.follow.deleteMany({ where: { userId, artistId: id } });
  }
  refresh();
}

export async function createPlaylist(name: string): Promise<Result<{ id: string; name: string }>> {
  const userId = await requireUserId();
  const clean = str(name, 60);
  if (!clean) return { ok: false, error: "Give your playlist a name." };
  const lim = await hit("playlist:" + userId, 30, 60);
  if (!lim.ok) return { ok: false, error: `Too many new playlists. Try again in ${waitText(lim.retryAfterSec)}.` };
  if ((await prisma.userPlaylist.count({ where: { userId } })) >= 200) return { ok: false, error: "You have reached the playlist limit." };
  const p = await prisma.userPlaylist.create({ data: { userId, name: clean } });
  refresh();
  return { ok: true, id: p.id, name: p.name };
}

async function ownPlaylist(userId: string, playlistId: string) {
  return prisma.userPlaylist.findFirst({ where: { id: str(playlistId, 60), userId }, select: { id: true } });
}

export async function addToPlaylist(playlistId: string, track: TrackSnap): Promise<Result> {
  const userId = await requireUserId();
  const p = await ownPlaylist(userId, playlistId);
  if (!p) return { ok: false, error: "Playlist not found." };
  const s = snap(track);
  await prisma.playlistTrack.upsert({
    where: { playlistId_trackId: { playlistId: p.id, trackId: s.trackId } },
    create: { playlistId: p.id, ...s },
    update: {},
  });
  await prisma.userPlaylist.update({ where: { id: p.id }, data: { updatedAt: new Date() } });
  refresh();
  return { ok: true };
}

export async function removeFromPlaylist(playlistId: string, trackId: string) {
  const userId = await requireUserId();
  const p = await ownPlaylist(userId, playlistId);
  if (!p) return;
  await prisma.playlistTrack.deleteMany({ where: { playlistId: p.id, trackId: str(trackId, 200) } });
  refresh();
}

export async function renamePlaylist(playlistId: string, name: string): Promise<Result> {
  const userId = await requireUserId();
  const p = await ownPlaylist(userId, playlistId);
  const clean = str(name, 60);
  if (!p || !clean) return { ok: false, error: "Give your playlist a name." };
  await prisma.userPlaylist.update({ where: { id: p.id }, data: { name: clean } });
  refresh();
  return { ok: true };
}

export async function deletePlaylist(playlistId: string) {
  const userId = await requireUserId();
  const p = await ownPlaylist(userId, playlistId);
  if (p) await prisma.userPlaylist.delete({ where: { id: p.id } });
  refresh();
}

export async function recordPlay(track: TrackSnap) {
  const userId = await requireUserId();
  const s = snap(track);
  if (!s.trackId) return;
  const [user, last] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { settings: true } }),
    prisma.playHistory.findFirst({ where: { userId }, orderBy: { playedAt: "desc" }, select: { trackId: true, playedAt: true } }),
  ]);
  if (readSettings(user?.settings).privateSession) return;
  if (last && last.trackId === s.trackId && Date.now() - last.playedAt.getTime() < 60_000) return;
  await prisma.playHistory.create({ data: { userId, ...s } });
  // Plays of creator uploads count towards the song's stream total.
  if (s.trackId.startsWith("s-")) await prisma.song.updateMany({ where: { id: s.trackId.slice(2) }, data: { plays: { increment: 1 } } });
  // Keep history bounded: now and then, drop everything older than the newest 500 plays.
  if (Math.random() < 0.05) {
    const cutoff = await prisma.playHistory.findFirst({ where: { userId }, orderBy: { playedAt: "desc" }, skip: 499, select: { playedAt: true } });
    if (cutoff) await prisma.playHistory.deleteMany({ where: { userId, playedAt: { lt: cutoff.playedAt } } });
  }
}

export async function clearHistory() {
  const userId = await requireUserId();
  await prisma.playHistory.deleteMany({ where: { userId } });
  refresh();
}

// ---------- Profile and settings ----------

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const userId = await requireUserId();
  const name = str(form.get("name"), 40);
  const username = str(form.get("username"), 20).toLowerCase();
  const bio = str(form.get("bio"), 160);
  if (!name) return { error: "Enter a display name." };
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "Username must be 3 to 20 letters, numbers or underscores." };
  const taken = await prisma.user.findFirst({ where: { username, NOT: { id: userId } }, select: { id: true } });
  if (taken) return { error: "That username is taken." };
  await prisma.user.update({ where: { id: userId }, data: { name, username, bio: bio || null } });
  refresh();
  return { ok: true };
}

export async function updateSettings(patch: Partial<Settings>) {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { settings: true } });
  const next = readSettings({ ...readSettings(user?.settings), ...patch });
  await prisma.user.update({ where: { id: userId }, data: { settings: next } });
  refresh();
  return next;
}

export async function markNotificationsRead() {
  const userId = await requireUserId();
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  refresh();
}

// ---------- B-Coins: gifts and unlocks ----------

async function spend(userId: string, total: number, kind: string, note: string, extra: (tx: Prisma.TransactionClient) => Promise<unknown>) {
  try {
    await prisma.$transaction(async (tx) => {
      const r = await tx.user.updateMany({ where: { id: userId, coins: { gte: total } }, data: { coins: { decrement: total } } });
      if (r.count !== 1) throw new Error("INSUFFICIENT");
      await tx.coinTransaction.create({ data: { userId, amount: -total, kind, note } });
      await extra(tx);
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") return false;
    throw e;
  }
  return true;
}

export async function sendGift(artistId: string, giftId: string, quantity: number, message: string): Promise<Result<{ balance: number }>> {
  const userId = await requireUserId();
  const lim = await hit("coins:" + userId, 20, 60);
  if (!lim.ok) return { ok: false, error: `Slow down a little. Try again in ${waitText(lim.retryAfterSec)}.` };
  const gift = GIFTS.find((g) => g.id === giftId);
  const qty = Math.floor(Number(quantity));
  const found = await catalog.getArtist(str(artistId, 200));
  if (!gift || !found || !(qty >= 1 && qty <= 99)) return { ok: false, error: "That gift could not be sent." };
  const total = gift.price * qty;
  const msg = str(message, 140);
  const artist = found.artist;

  const paid = await spend(userId, total, "GIFT", `${qty} × ${gift.name} to ${artist.name}`, async (tx) => {
    await tx.gift.create({ data: { userId, artistId: artist.id, artistName: artist.name, giftId: gift.id, giftName: gift.name, quantity: qty, coins: total, message: msg || null } });
    await tx.notification.create({ data: { userId, title: "Gift sent", body: `You sent ${qty} × ${gift.name} to ${artist.name}.`, href: `/artist/${artist.id}` } });
    const owner = await tx.artistProfile.findUnique({ where: { id: artist.id }, select: { userId: true } });
    const me = await tx.user.findUnique({ where: { id: userId }, select: { name: true, username: true } });
    if (owner) {
      await tx.notification.create({
        data: { userId: owner.userId, title: "You got a gift", body: `${me?.name || me?.username || "A fan"} sent you ${qty} × ${gift.name} (${total} B)${msg ? `: "${msg}"` : "."}`, href: "/studio" },
      });
    }
  });
  if (!paid) return { ok: false, error: "Not enough B-Coins." };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
  refresh();
  return { ok: true, balance: user?.coins ?? 0 };
}

export async function unlockExclusive(exclusiveId: string): Promise<Result<{ balance: number }>> {
  const userId = await requireUserId();
  const lim = await hit("coins:" + userId, 20, 60);
  if (!lim.ok) return { ok: false, error: `Slow down a little. Try again in ${waitText(lim.retryAfterSec)}.` };
  const item = await prisma.exclusive.findUnique({ where: { id: str(exclusiveId, 40) }, select: { id: true, title: true, price: true, artist: { select: { id: true, name: true, userId: true } } } });
  if (!item) return { ok: false, error: "That item is no longer available." };
  const itemId = "ex:" + item.id;

  const already = await prisma.unlock.findUnique({ where: { userId_itemId: { userId, itemId } } });
  if (!already && item.artist.userId !== userId) {
    const paid = await spend(userId, item.price, "UNLOCK", `Unlocked "${item.title}" from ${item.artist.name}`, async (tx) => {
      await tx.unlock.create({ data: { userId, itemId } });
      await tx.notification.create({ data: { userId: item.artist.userId, title: "A fan unlocked your exclusive", body: `"${item.title}" (+${item.price} B)`, href: "/studio" } });
    });
    if (!paid) return { ok: false, error: "Not enough B-Coins." };
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { coins: true } });
  refresh();
  return { ok: true, balance: user?.coins ?? 0 };
}

// ---------- Sign-up ----------

export async function registerUser(input: { name: string; email: string; password: string }): Promise<Result> {
  const name = str(input.name, 40);
  const email = str(input.email, 200).toLowerCase();
  const password = String(input.password ?? "");
  if (!name) return { ok: false, error: "Enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid email like name@gmail.com." };
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };
  const lim = await hit("signup:ip:" + (await clientIp()), 5, 3600);
  if (!lim.ok) return { ok: false, error: `Too many sign-ups from this network. Try again in ${waitText(lim.retryAfterSec)}.` };
  const existing = await prisma.user.findUnique({ where: { email }, select: { passwordHash: true } });
  if (existing) {
    return { ok: false, error: existing.passwordHash ? "An account with this email already exists. Log in instead." : "This email already signed up with Google, Apple or Facebook. Use that button to log in." };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({ data: { name, email, passwordHash } });
  await setUpNewUser(user.id);
  // Ask them to confirm the address (only when email sending is switched on).
  await sendVerificationEmail(user.id, await headers()).catch(() => false);
  return { ok: true };
}

// ---------- Catalog reads used by client components ----------

export async function fetchTrackDetails(trackId: string, artistId?: string) {
  await requireUserId();
  const [details, artist] = await Promise.all([
    catalog.getTrackDetails(str(trackId, 200)),
    artistId ? catalog.getArtist(str(artistId, 200)) : null,
  ]);
  return {
    details,
    artist: artist ? { name: artist.artist.name, genre: artist.artist.genre, bio: artist.artist.bio, monthlyListeners: artist.artist.monthlyListeners } : null,
  };
}

export async function fetchStationTracks(stationId: string) {
  await requireUserId();
  return catalog.getStationTracks(str(stationId, 200));
}

export async function askBrisicAI(prompt: string) {
  await requireUserId();
  return catalog.suggest(str(prompt, 300));
}

/** Heart on a catalog playlist: save a copy of it into the user's own playlists (or remove that copy). */
export async function toggleSavedPlaylist(catalogPlaylistId: string): Promise<Result<{ saved: boolean }>> {
  const userId = await requireUserId();
  const lim = await hit("playlist:" + userId, 30, 60);
  if (!lim.ok) return { ok: false, error: `Too many changes. Try again in ${waitText(lim.retryAfterSec)}.` };
  const data = await catalog.getPlaylist(str(catalogPlaylistId, 200));
  if (!data) return { ok: false, error: "Playlist not found." };
  const name = str(data.playlist.title, 60);
  const existing = await prisma.userPlaylist.findFirst({ where: { userId, name }, select: { id: true } });
  if (existing) {
    await prisma.userPlaylist.delete({ where: { id: existing.id } });
    refresh();
    return { ok: true, saved: false };
  }
  if ((await prisma.userPlaylist.count({ where: { userId } })) >= 200) return { ok: false, error: "You have reached the playlist limit." };
  await prisma.userPlaylist.create({
    data: {
      userId, name,
      tracks: { create: data.tracks.slice(0, 500).map((t) => ({ trackId: t.id, title: t.title, artistId: t.artistId, artistName: t.artistName, durationSec: t.durationSec })) },
    },
  });
  refresh();
  return { ok: true, saved: true };
}

// ---------- Live search ----------

/** Songs and artists for the live search screen while the user types. */
export async function searchLive(query: string) {
  await requireUserId();
  const q = str(query, 80);
  if (!q) return { tracks: [], artists: [] };
  const r = await catalog.search(q);
  return { tracks: r.tracks.slice(0, 10), artists: r.artists.slice(0, 5) };
}

// ---------- Paystack: buy B-Coins ----------

/** Opens a Paystack checkout for a B-Coin bundle. Coins are added later, once Paystack confirms. */
export async function startCoinPurchase(coins: number, method: string): Promise<Result<{ url: string }>> {
  const userId = await requireUserId();
  if (!paystackEnabled()) return { ok: false, error: "Payments are not switched on yet." };
  const pack = COIN_PACKS.find((p) => p.coins === Number(coins));
  if (!pack) return { ok: false, error: "Choose a bundle." };
  const limit = await hit("pay:" + userId, 10, 600);
  if (!limit.ok) return { ok: false, error: `Too many checkouts. Try again in ${waitText(limit.retryAfterSec)}.` };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  // Paystack needs an email for the receipt; accounts without one (some Facebook sign-ins) get a placeholder.
  const email = user?.email || `${userId}@users.brisic.app`;
  const reference = newReference();
  const amountKobo = pack.priceNaira * 100;
  await prisma.payment.create({ data: { reference, userId, kind: "COINS", coins: pack.coins, amountKobo } });

  const h = await headers();
  const origin = process.env.AUTH_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  try {
    const url = await initialize({
      email, amountKobo, reference,
      callbackUrl: `${origin}/api/paystack/callback`,
      channels: CHANNELS[method],
      metadata: { userId, coins: pack.coins, cancel_action: `${origin}/coins` },
    });
    return { ok: true, url };
  } catch {
    await prisma.payment.update({ where: { reference }, data: { status: "failed" } });
    return { ok: false, error: "Could not open Paystack. Try again in a moment." };
  }
}

/** Opens a Paystack checkout for Brisic Premium (Individual), monthly or yearly, charged in Naira. */
export async function startPremiumPurchase(yearly: boolean): Promise<Result<{ url: string }>> {
  const userId = await requireUserId();
  if (!paystackEnabled()) return { ok: false, error: "Payments are not switched on yet." };
  const limit = await hit("pay:" + userId, 10, 600);
  if (!limit.ok) return { ok: false, error: `Too many checkouts. Try again in ${waitText(limit.retryAfterSec)}.` };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  const email = user?.email || `${userId}@users.brisic.app`;
  const reference = newReference();
  const amountKobo = premiumPriceNaira(!!yearly) * 100;
  const months = yearly ? 12 : 1;
  await prisma.payment.create({ data: { reference, userId, kind: "PREMIUM", months, coins: 0, amountKobo } });
  const h = await headers();
  const origin = process.env.AUTH_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  try {
    const url = await initialize({ email, amountKobo, reference, callbackUrl: `${origin}/api/paystack/callback`, metadata: { userId, plan: "individual", months, cancel_action: `${origin}/premium` } });
    return { ok: true, url };
  } catch {
    await prisma.payment.update({ where: { reference }, data: { status: "failed" } });
    return { ok: false, error: "Could not open Paystack. Try again in a moment." };
  }
}
