"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { catalog } from "@/lib/catalog";
import { hit, waitText } from "@/lib/rate-limit";
import { ARTIST_ROOM_SUFFIX, IDLE_MS, newPartyCode, normalizeCode } from "@/lib/party";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };
const str = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);

const nameOf = async (userId: string) => {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, username: true } });
  return u?.name || u?.username || "Listener";
};

/** The room for a code, if it is still running, plus whether this user is in it. */
async function liveRoom(rawCode: string, userId: string) {
  const code = normalizeCode(rawCode);
  if (!code) return null;
  const room = await prisma.partyRoom.findUnique({
    where: { code },
    select: { id: true, code: true, hostId: true, artistId: true, chatOpen: true, endedAt: true, updatedAt: true, members: { where: { userId }, select: { id: true } } },
  });
  if (!room || room.endedAt) return null;
  if (!room.artistId && Date.now() - room.updatedAt.getTime() > IDLE_MS) return null;
  return { ...room, isMember: room.members.length > 0, isHost: room.hostId === userId };
}
const touch = (roomId: string) => prisma.partyRoom.update({ where: { id: roomId }, data: { updatedAt: new Date() } });

export async function createParty(input: { name: string; isPublic: boolean; chatOpen: boolean }): Promise<Result<{ code: string }>> {
  const userId = await requireUserId();
  const limit = await hit("party:create:" + userId, 6, 3600);
  if (!limit.ok) return { ok: false, error: `You've started a lot of parties. Try again in ${waitText(limit.retryAfterSec)}.` };
  const name = str(input.name, 60) || "Community Party";

  // Occasionally clear out rooms that ended over a week ago.
  if (Math.random() < 0.05) {
    await prisma.partyRoom.deleteMany({ where: { OR: [{ endedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } }, { updatedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } }] } });
  }
  // One running party per host: starting a new one ends the old ones.
  await prisma.partyRoom.updateMany({ where: { hostId: userId, endedAt: null }, data: { endedAt: new Date() } });

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newPartyCode();
    try {
      await prisma.partyRoom.create({
        data: { code, name, hostId: userId, isPublic: !!input.isPublic, chatOpen: !!input.chatOpen, members: { create: { userId } } },
      });
      return { ok: true, code };
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("Unique constraint"))) throw e;
    }
  }
  return { ok: false, error: "Could not start the party. Try again." };
}

export async function joinParty(rawCode: string): Promise<Result<{ code: string }>> {
  const userId = await requireUserId();
  const limit = await hit("party:join:" + userId, 30, 600);
  if (!limit.ok) return { ok: false, error: `Too many tries. Wait ${waitText(limit.retryAfterSec)}.` };
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: "Enter a party code like BRS-7K2Q9, or paste the invite link." };
  const room = await liveRoom(code, userId);
  if (!room) return { ok: false, error: "That party has ended or the code is wrong. Check it with the host." };
  if (room.artistId && !room.isMember) {
    const follows = await prisma.follow.findUnique({ where: { userId_artistId: { userId, artistId: room.artistId } }, select: { id: true } });
    if (!follows) return { ok: false, error: "Only followers can enter this community party. Follow the artist first." };
  }
  await prisma.partyMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId },
    update: { lastSeen: new Date() },
  });
  if (!room.isMember) {
    await prisma.partyMessage.create({ data: { roomId: room.id, userId, userName: await nameOf(userId), text: "joined the party" } });
  }
  return { ok: true, code: room.code };
}

export async function leaveParty(rawCode: string): Promise<Result> {
  const userId = await requireUserId();
  const room = await liveRoom(rawCode, userId);
  if (!room) return { ok: true };
  if (room.isHost) {
    await prisma.partyRoom.update({ where: { id: room.id }, data: { endedAt: new Date() } });
  } else {
    await prisma.partyMember.deleteMany({ where: { roomId: room.id, userId } });
  }
  return { ok: true };
}

export async function addPartySong(rawCode: string, trackId: string): Promise<Result> {
  const userId = await requireUserId();
  const room = await liveRoom(rawCode, userId);
  if (!room) return { ok: false, error: "This party has ended." };
  if (!room.isMember) return { ok: false, error: "Join the party to add songs." };
  const limit = await hit("party:add:" + userId, 12, 60);
  if (!limit.ok) return { ok: false, error: `Slow down a little. Try again in ${waitText(limit.retryAfterSec)}.` };
  const [track] = await catalog.getTracksByIds([str(trackId, 200)]);
  if (!track) return { ok: false, error: "That song is not available." };
  const waiting = await prisma.partyQueueItem.count({ where: { roomId: room.id, playedAt: null } });
  if (waiting >= 50) return { ok: false, error: "The queue is full. Vote for songs already in it." };
  const already = await prisma.partyQueueItem.findFirst({ where: { roomId: room.id, playedAt: null, trackId: track.id }, select: { id: true } });
  if (already) return { ok: false, error: "That song is already in the queue. Vote for it instead." };
  await prisma.partyQueueItem.create({
    data: {
      roomId: room.id, trackId: track.id, title: track.title, artistName: track.artistName,
      durationSec: track.durationSec, addedById: userId, addedByName: await nameOf(userId),
    },
  });
  await touch(room.id);
  return { ok: true };
}

export async function votePartySong(itemId: string): Promise<Result<{ voted: boolean }>> {
  const userId = await requireUserId();
  const limit = await hit("party:vote:" + userId, 60, 60);
  if (!limit.ok) return { ok: false, error: "Too many votes at once. Wait a moment." };
  const item = await prisma.partyQueueItem.findUnique({
    where: { id: str(itemId, 40) },
    select: { id: true, playedAt: true, room: { select: { code: true } } },
  });
  if (!item || item.playedAt) return { ok: false, error: "That song has already played." };
  const room = await liveRoom(item.room.code, userId);
  if (!room?.isMember) return { ok: false, error: "Join the party to vote." };

  const existing = await prisma.partyVote.findUnique({ where: { itemId_userId: { itemId: item.id, userId } } });
  if (existing) {
    await prisma.$transaction([
      prisma.partyVote.delete({ where: { itemId_userId: { itemId: item.id, userId } } }),
      prisma.partyQueueItem.update({ where: { id: item.id }, data: { votes: { decrement: 1 } } }),
    ]);
    return { ok: true, voted: false };
  }
  try {
    await prisma.$transaction([
      prisma.partyVote.create({ data: { itemId: item.id, userId } }),
      prisma.partyQueueItem.update({ where: { id: item.id }, data: { votes: { increment: 1 } } }),
    ]);
  } catch {
    // A double tap raced the first vote; it already counted.
  }
  return { ok: true, voted: true };
}

export async function sendPartyMessage(rawCode: string, text: string): Promise<Result> {
  const userId = await requireUserId();
  const room = await liveRoom(rawCode, userId);
  if (!room) return { ok: false, error: "This party has ended." };
  if (!room.isMember) return { ok: false, error: "Join the party to chat." };
  if (!room.chatOpen && !room.isHost) return { ok: false, error: "The host has closed the chat." };
  const body = str(text, 200);
  if (!body) return { ok: false, error: "Type a message first." };
  const limit = await hit("party:chat:" + userId, 20, 60);
  if (!limit.ok) return { ok: false, error: `You're sending messages fast. Wait ${waitText(limit.retryAfterSec)}.` };
  await prisma.partyMessage.create({ data: { roomId: room.id, userId, userName: await nameOf(userId), text: body } });
  await touch(room.id);
  // Keep each room's chat to its newest 300 messages.
  if (Math.random() < 0.05) {
    const old = await prisma.partyMessage.findMany({ where: { roomId: room.id }, orderBy: { createdAt: "desc" }, skip: 300, select: { id: true } });
    if (old.length) await prisma.partyMessage.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  }
  return { ok: true };
}

/** Host only: end the current song now; the next poll moves to the top-voted song. */
export async function skipPartySong(rawCode: string): Promise<Result> {
  const userId = await requireUserId();
  const room = await liveRoom(rawCode, userId);
  if (!room?.isHost) return { ok: false, error: "Only the host can skip." };
  await prisma.partyRoom.update({ where: { id: room.id }, data: { nowStarted: new Date(0) } });
  return { ok: true };
}

/** Host only: open or close the chat for listeners. */
export async function setPartyChat(rawCode: string, open: boolean): Promise<Result> {
  const userId = await requireUserId();
  const room = await liveRoom(rawCode, userId);
  if (!room?.isHost) return { ok: false, error: "Only the host can change this." };
  await prisma.partyRoom.update({ where: { id: room.id }, data: { chatOpen: !!open } });
  return { ok: true };
}

/** Songs to add, from the catalog search (or top songs when the box is empty). */
export async function searchPartySongs(q: string) {
  await requireUserId();
  const term = str(q, 80);
  if (!term) return (await catalog.suggest("top")).tracks.slice(0, 8);
  return (await catalog.search(term)).tracks.slice(0, 12);
}

/** Full catalog tracks for party songs, so "Listen along" can play them. */
export async function partyTracks(ids: string[]) {
  await requireUserId();
  return catalog.getTracksByIds(ids.slice(0, 20).map((i) => str(i, 200)));
}

/**
 * Join an artist's official community party. Fans can only join (not create) these rooms,
 * and only after following the artist. The room is opened the first time a fan joins.
 */
export async function joinArtistParty(artistId: string): Promise<Result<{ code: string }>> {
  const userId = await requireUserId();
  const limit = await hit("party:join:" + userId, 30, 600);
  if (!limit.ok) return { ok: false, error: `Too many tries. Wait ${waitText(limit.retryAfterSec)}.` };
  const id = str(artistId, 200);
  const data = await catalog.getArtist(id);
  if (!data) return { ok: false, error: "Artist not found." };
  const follows = await prisma.follow.findUnique({ where: { userId_artistId: { userId, artistId: id } }, select: { id: true } });
  if (!follows) return { ok: false, error: `Follow ${data.artist.name} to join their community party.` };

  let room = await prisma.partyRoom.findUnique({ where: { artistId: id }, select: { id: true, code: true, endedAt: true } });
  for (let attempt = 0; !room && attempt < 5; attempt++) {
    try {
      room = await prisma.partyRoom.create({
        data: { code: newPartyCode(), name: data.artist.name + ARTIST_ROOM_SUFFIX, artistId: id, hostId: null, isPublic: true, chatOpen: true },
        select: { id: true, code: true, endedAt: true },
      });
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("Unique constraint"))) throw e;
      // Another fan opened it at the same moment, or the code was taken: read it again.
      room = await prisma.partyRoom.findUnique({ where: { artistId: id }, select: { id: true, code: true, endedAt: true } });
    }
  }
  if (!room) return { ok: false, error: "Could not open the community party. Try again." };
  if (room.endedAt) await prisma.partyRoom.update({ where: { id: room.id }, data: { endedAt: null } });

  const existing = await prisma.partyMember.findUnique({ where: { roomId_userId: { roomId: room.id, userId } }, select: { id: true } });
  await prisma.partyMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId },
    update: { lastSeen: new Date() },
  });
  if (!existing) await prisma.partyMessage.create({ data: { roomId: room.id, userId, userName: await nameOf(userId), text: "joined the party" } });
  return { ok: true, code: room.code };
}
