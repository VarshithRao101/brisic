// Community Party: shared listening rooms. Phones poll the room state every few seconds;
// the song advances lazily on read, guarded so two readers cannot advance it twice.

import { prisma } from "@/lib/prisma";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
export const newPartyCode = () => "BRS-" + Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

/** Accepts "brs-7k2q9", "BRS7K2Q9" or a full invite link and returns "BRS-7K2Q9", or null. */
export function normalizeCode(input: string): string | null {
  const m = String(input ?? "").toUpperCase().match(/BRS-?([A-Z0-9]{5})\b/);
  return m ? "BRS-" + m[1] : null;
}

/** Members seen within this window count as "in the room". */
export const ACTIVE_MS = 90_000;
/** Rooms with no activity for this long are treated as over. */
export const IDLE_MS = 6 * 3_600_000;
/** Artist community rooms are named "<Artist> Listening Room" and have no listener host. */
export const ARTIST_ROOM_SUFFIX = " Listening Room";
const roomHostName = (r: { artistId: string | null; name: string; host: { name: string | null; username: string | null } | null }) =>
  r.artistId ? r.name.replace(ARTIST_ROOM_SUFFIX, "") : r.host ? displayName(r.host) : "Listener";

export type PartyState = {
  code: string;
  name: string;
  hostName: string;
  isHost: boolean;
  isMember: boolean;
  isPublic: boolean;
  chatOpen: boolean;
  ended: boolean;
  /** Set for an artist community room (join only, no host controls). */
  artistId: string | null;
  listening: number;
  now: { id: string; trackId: string; title: string; artistName: string; addedByName: string; durationSec: number; elapsed: number } | null;
  upNext: { id: string; trackId: string; title: string; artistName: string; addedByName: string; votes: number; voted: boolean; mine: boolean }[];
  members: { id: string; name: string; image: string | null; host: boolean; you: boolean }[];
  messages: { id: string; userName: string; text: string; at: number; you: boolean; host: boolean }[];
  serverTime: number;
};

const displayName = (u: { name: string | null; username: string | null }) => u.name || u.username || "Listener";

/** Moves to the highest-voted waiting song when nothing is playing or the current song has finished. */
async function advanceIfDone(room: { id: string; nowItemId: string | null; nowStarted: Date | null }) {
  const now = Date.now();
  if (room.nowItemId && room.nowStarted) {
    const cur = await prisma.partyQueueItem.findUnique({ where: { id: room.nowItemId }, select: { durationSec: true } });
    if (cur && now - room.nowStarted.getTime() < cur.durationSec * 1000) return room;
  }
  const next = await prisma.partyQueueItem.findFirst({
    where: { roomId: room.id, playedAt: null },
    orderBy: [{ votes: "desc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  if (!next && !room.nowItemId) return room;
  const started = new Date(now);
  // Only the reader that still sees the old song wins the update.
  const won = await prisma.partyRoom.updateMany({
    where: { id: room.id, nowItemId: room.nowItemId },
    data: { nowItemId: next?.id ?? null, nowStarted: next ? started : null },
  });
  if (won.count === 1 && next) {
    await prisma.partyQueueItem.update({ where: { id: next.id }, data: { playedAt: started } });
  }
  const fresh = await prisma.partyRoom.findUnique({ where: { id: room.id }, select: { id: true, nowItemId: true, nowStarted: true } });
  return fresh ?? room;
}

export async function getPartyState(code: string, userId: string): Promise<PartyState | null> {
  const room = await prisma.partyRoom.findUnique({
    where: { code },
    select: {
      id: true, code: true, name: true, hostId: true, artistId: true, isPublic: true, chatOpen: true,
      nowItemId: true, nowStarted: true, endedAt: true, updatedAt: true,
      host: { select: { name: true, username: true } },
    },
  });
  if (!room) return null;
  // Artist rooms stay open; listener parties end after IDLE_MS without activity.
  const ended = !!room.endedAt || (!room.artistId && Date.now() - room.updatedAt.getTime() > IDLE_MS);

  // Mark this listener as present (no-op when not a member).
  const seen = ended ? { count: 0 } : await prisma.partyMember.updateMany({ where: { roomId: room.id, userId }, data: { lastSeen: new Date() } });
  const playing = ended ? room : await advanceIfDone(room);

  const since = new Date(Date.now() - ACTIVE_MS);
  const [nowItem, waiting, myVotes, members, messages] = await Promise.all([
    playing.nowItemId ? prisma.partyQueueItem.findUnique({ where: { id: playing.nowItemId } }) : null,
    prisma.partyQueueItem.findMany({ where: { roomId: room.id, playedAt: null }, orderBy: [{ votes: "desc" }, { createdAt: "asc" }], take: 50 }),
    prisma.partyVote.findMany({ where: { userId, item: { roomId: room.id, playedAt: null } }, select: { itemId: true } }),
    prisma.partyMember.findMany({
      where: { roomId: room.id, lastSeen: { gte: since } },
      orderBy: { joinedAt: "asc" }, take: 60,
      select: { userId: true, user: { select: { name: true, username: true, image: true } } },
    }),
    prisma.partyMessage.findMany({ where: { roomId: room.id }, orderBy: { createdAt: "desc" }, take: 60 }),
  ]);
  const voted = new Set(myVotes.map((v) => v.itemId));

  return {
    code: room.code,
    name: room.name,
    hostName: roomHostName(room),
    artistId: room.artistId,
    isHost: room.hostId === userId,
    isMember: seen.count === 1,
    isPublic: room.isPublic,
    chatOpen: room.chatOpen,
    ended,
    listening: members.length,
    now: nowItem && playing.nowStarted
      ? {
          id: nowItem.id, trackId: nowItem.trackId, title: nowItem.title, artistName: nowItem.artistName,
          addedByName: nowItem.addedByName, durationSec: nowItem.durationSec,
          elapsed: Math.min(nowItem.durationSec, Math.max(0, Math.floor((Date.now() - playing.nowStarted.getTime()) / 1000))),
        }
      : null,
    upNext: waiting.map((w) => ({
      id: w.id, trackId: w.trackId, title: w.title, artistName: w.artistName, addedByName: w.addedByName,
      votes: w.votes, voted: voted.has(w.id), mine: w.addedById === userId,
    })),
    members: members.map((m) => ({ id: m.userId, name: displayName(m.user), image: m.user.image, host: m.userId === room.hostId, you: m.userId === userId })),
    messages: messages.reverse().map((m) => ({ id: m.id, userName: m.userName, text: m.text, at: m.createdAt.getTime(), you: m.userId === userId, host: m.userId === room.hostId })),
    serverTime: Date.now(),
  };
}

/** Public rooms with recent activity, busiest first. */
export async function listLiveParties(limit = 12) {
  const rooms = await prisma.partyRoom.findMany({
    where: { isPublic: true, endedAt: null, artistId: null, updatedAt: { gte: new Date(Date.now() - IDLE_MS) } },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      code: true, name: true, createdAt: true, artistId: true,
      host: { select: { name: true, username: true } },
      _count: { select: { members: { where: { lastSeen: { gte: new Date(Date.now() - ACTIVE_MS) } } } } },
    },
  });
  return rooms
    .map((r) => ({ code: r.code, name: r.name, hostName: roomHostName(r), listening: r._count.members, createdAt: r.createdAt }))
    .sort((a, b) => b.listening - a.listening);
}

/** Running parties this user is in, most recently active first. */
export async function myLiveParties(userId: string) {
  const rows = await prisma.partyMember.findMany({
    where: { userId, room: { endedAt: null, OR: [{ artistId: { not: null } }, { updatedAt: { gte: new Date(Date.now() - IDLE_MS) } }] } },
    orderBy: { lastSeen: "desc" }, take: 5,
    select: { room: { select: { code: true, name: true, hostId: true } } },
  });
  return rows.map((r) => ({ ...r.room, isHost: r.room.hostId === userId }));
}

/** The artist's community room (if one has started) with how many fans are in it now. */
export async function artistRoomInfo(artistId: string) {
  const room = await prisma.partyRoom.findUnique({
    where: { artistId },
    select: { code: true, _count: { select: { members: { where: { lastSeen: { gte: new Date(Date.now() - ACTIVE_MS) } } } } } },
  });
  return room ? { code: room.code, listening: room._count.members } : null;
}
