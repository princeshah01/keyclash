import { randomBytes } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { type Player, roomMembers, rooms } from "@/lib/db/schema";
import { HttpError, isUniqueViolation } from "./http";

const CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const MAX_ROOMS_PER_PLAYER = 50;
const MAX_MEMBERS_PER_ROOM = 100;

export const ROOM_CODE_PATTERN = /^[a-zA-Z0-9]{8}$/;

export const roomInput = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Room names need at least 2 characters")
    .max(40, "Room names can be up to 40 characters"),
});

export interface RoomSummary {
  code: string;
  createdAt: string;
  id: string;
  isOwner: boolean;
  joinedAt: string;
  memberCount: number;
  name: string;
}

function generateCode() {
  const bytes = randomBytes(CODE_LENGTH);
  return Array.from(bytes, (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

export async function findRoomByCode(code: string) {
  if (!ROOM_CODE_PATTERN.test(code)) {
    return null;
  }
  const [room] = await db.select().from(rooms).where(eq(rooms.code, code)).limit(1);
  return room ?? null;
}

async function requireRoom(code: string) {
  const room = await findRoomByCode(code);
  if (!room) {
    throw new HttpError(404, "room_not_found", "That room doesn't exist or was closed");
  }
  return room;
}

async function memberCount(roomId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId));
  return row?.value ?? 0;
}

export async function isMember(roomId: string, playerId: string) {
  const [row] = await db
    .select({ roomId: roomMembers.roomId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.playerId, playerId)))
    .limit(1);
  return Boolean(row);
}

async function assertRoomQuota(playerId: string) {
  const [row] = await db
    .select({ value: count() })
    .from(roomMembers)
    .where(eq(roomMembers.playerId, playerId));
  if ((row?.value ?? 0) >= MAX_ROOMS_PER_PLAYER) {
    throw new HttpError(409, "too_many_rooms", `You can be in up to ${MAX_ROOMS_PER_PLAYER} rooms`);
  }
}

export async function listRooms(playerId: string): Promise<RoomSummary[]> {
  const rows = await db
    .select({
      id: rooms.id,
      code: rooms.code,
      name: rooms.name,
      ownerId: rooms.ownerId,
      createdAt: rooms.createdAt,
      joinedAt: roomMembers.joinedAt,
      memberCount: sql<number>`(select count(*)::int from room_members m where m.room_id = ${rooms.id})`,
    })
    .from(roomMembers)
    .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.playerId, playerId))
    .orderBy(roomMembers.joinedAt);

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    isOwner: row.ownerId === playerId,
    memberCount: row.memberCount,
    createdAt: row.createdAt.toISOString(),
    joinedAt: row.joinedAt.toISOString(),
  }));
}

export async function createRoom(player: Player, name: string) {
  await assertRoomQuota(player.id);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await db.transaction(async (tx) => {
        const [room] = await tx
          .insert(rooms)
          .values({ code: generateCode(), name, ownerId: player.id })
          .returning();
        await tx.insert(roomMembers).values({ roomId: room.id, playerId: player.id });
        return room;
      });
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
    }
  }
  throw new HttpError(503, "code_exhausted", "Could not create a room, try again");
}

export async function previewRoom(code: string, playerId: string | null) {
  const room = await requireRoom(code);
  return {
    code: room.code,
    name: room.name,
    memberCount: await memberCount(room.id),
    isMember: playerId ? await isMember(room.id, playerId) : false,
  };
}

export async function joinRoom(player: Player, code: string) {
  const room = await requireRoom(code);
  if (await isMember(room.id, player.id)) {
    return room;
  }
  await assertRoomQuota(player.id);
  if ((await memberCount(room.id)) >= MAX_MEMBERS_PER_ROOM) {
    throw new HttpError(409, "room_full", "This room is full");
  }
  await db
    .insert(roomMembers)
    .values({ roomId: room.id, playerId: player.id })
    .onConflictDoNothing();
  return room;
}

async function removeIfEmpty(roomId: string) {
  await db
    .delete(rooms)
    .where(
      and(
        eq(rooms.id, roomId),
        sql`not exists (select 1 from room_members m where m.room_id = ${rooms.id})`,
      ),
    );
}

export async function leaveRoom(player: Player, code: string) {
  const room = await requireRoom(code);
  await db
    .delete(roomMembers)
    .where(and(eq(roomMembers.roomId, room.id), eq(roomMembers.playerId, player.id)));
  await removeIfEmpty(room.id);
}

export async function leaveAllRooms(player: Player) {
  const left = await db
    .delete(roomMembers)
    .where(eq(roomMembers.playerId, player.id))
    .returning({ roomId: roomMembers.roomId });
  for (const { roomId } of left) {
    await removeIfEmpty(roomId);
  }
  return left.length;
}

export async function requireMembership(player: Player, code: string) {
  const room = await requireRoom(code);
  if (!(await isMember(room.id, player.id))) {
    throw new HttpError(403, "not_a_member", "Join this room to see its leaderboard");
  }
  return room;
}
