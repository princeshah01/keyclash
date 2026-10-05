import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSessionUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { type Player, players, results } from "@/lib/db/schema";
import { cookieDefaults, HttpError, isUniqueViolation } from "./http";
import { NAME_PATTERN, nameFromProfile, randomGuestName } from "./names";

export const PLAYER_COOKIE = "kc_player";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_ATTEMPTS = 6;

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;

export interface PublicPlayer {
  avatarUrl: string | null;
  email: string | null;
  id: string;
  isGuest: boolean;
  name: string;
  nameEdited: boolean;
}

export function avatarUrlFor(player: Pick<Player, "id" | "avatarKey" | "image">) {
  if (player.avatarKey) {
    const version = player.avatarKey.split("/").at(-1)?.split(".")[0] ?? "1";
    return `/api/avatars/${player.id}?v=${version}`;
  }
  return player.image ? `/api/avatars/${player.id}?v=oauth` : null;
}

export function toPublicPlayer(player: Player): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    nameEdited: player.nameEdited,
    isGuest: player.authUserId === null,
    email: player.email,
    avatarUrl: avatarUrlFor(player),
  };
}

export async function readPlayerId() {
  const id = (await cookies()).get(PLAYER_COOKIE)?.value;
  return id && UUID_PATTERN.test(id) ? id : null;
}

export async function findPlayer(id: string) {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }
  const [player] = await db.select().from(players).where(eq(players.id, id)).limit(1);
  return player ?? null;
}

async function findByAuthUser(authUserId: string) {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.authUserId, authUserId))
    .limit(1);
  return player ?? null;
}

async function withUniqueName<T>(
  firstName: string,
  nextName: () => string,
  write: (name: string) => Promise<T>,
) {
  let name = firstName;
  for (let attempt = 0; attempt < NAME_ATTEMPTS; attempt++) {
    try {
      return await write(name);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }
      name = nextName();
    }
  }
  throw new HttpError(503, "name_exhausted", "Could not allocate a player name, try again");
}

async function createGuest() {
  const name = randomGuestName();
  return await withUniqueName(name, randomGuestName, async (candidate) => {
    const [player] = await db.insert(players).values({ name: candidate }).returning();
    return player;
  });
}

async function createForUser(user: SessionUser) {
  const nextName = () => nameFromProfile(user.name);
  try {
    return await withUniqueName(nextName(), nextName, async (candidate) => {
      const [player] = await db
        .insert(players)
        .values({
          name: candidate,
          authUserId: user.id,
          email: user.email,
          image: user.image ?? null,
        })
        .returning();
      return player;
    });
  } catch (error) {
    const existing = await findByAuthUser(user.id);
    if (existing) {
      return existing;
    }
    throw error;
  }
}

async function claimGuest(guest: Player, user: SessionUser) {
  const nextName = () => nameFromProfile(user.name);
  const claimed = await withUniqueName(
    guest.nameEdited ? guest.name : nextName(),
    nextName,
    async (candidate) => {
      const [player] = await db
        .update(players)
        .set({
          authUserId: user.id,
          email: user.email,
          image: user.image ?? null,
          name: candidate,
        })
        .where(and(eq(players.id, guest.id), isNull(players.authUserId)))
        .returning();
      return player;
    },
  );
  return claimed ?? (await findByAuthUser(user.id)) ?? (await createForUser(user));
}

async function mergeGuestInto(guest: Player, target: Player) {
  await db.transaction(async (tx) => {
    await tx.update(results).set({ playerId: target.id }).where(eq(results.playerId, guest.id));
    if (!target.avatarKey && guest.avatarKey) {
      await tx.update(players).set({ avatarKey: guest.avatarKey }).where(eq(players.id, target.id));
    }
    await tx.delete(players).where(and(eq(players.id, guest.id), isNull(players.authUserId)));
  });
  return (await findPlayer(target.id)) ?? target;
}

async function syncProfile(player: Player, user: SessionUser) {
  const image = user.image ?? null;
  if (player.email === user.email && player.image === image) {
    return player;
  }
  const [updated] = await db
    .update(players)
    .set({ email: user.email, image })
    .where(eq(players.id, player.id))
    .returning();
  return updated ?? player;
}

async function playerForUser(user: SessionUser, current: Player | null) {
  const guest = current && current.authUserId === null ? current : null;
  const linked = await findByAuthUser(user.id);

  if (!linked) {
    return guest ? await claimGuest(guest, user) : await createForUser(user);
  }

  const merged = guest ? await mergeGuestInto(guest, linked) : linked;
  return await syncProfile(merged, user);
}

async function setPlayerCookie(id: string) {
  const store = await cookies();
  store.set(PLAYER_COOKIE, id, { httpOnly: true, ...(await cookieDefaults(365)) });
}

export async function resolvePlayer() {
  await connection();
  const [store, user] = await Promise.all([cookies(), getSessionUser()]);
  const cookieId = store.get(PLAYER_COOKIE)?.value;
  const current = cookieId ? await findPlayer(cookieId) : null;

  let player: Player;
  if (user) {
    player = await playerForUser(user, current);
  } else if (current && current.authUserId === null) {
    player = current;
  } else {
    player = await createGuest();
  }

  if (player.id !== cookieId) {
    await setPlayerCookie(player.id);
  }

  return player;
}

export async function requirePlayer() {
  await connection();
  const [store, user] = await Promise.all([cookies(), getSessionUser()]);
  const cookieId = store.get(PLAYER_COOKIE)?.value;
  const player = cookieId ? await findPlayer(cookieId) : null;

  if (!player) {
    throw new HttpError(401, "no_player", "No player session, reload the page");
  }
  if (player.authUserId && player.authUserId !== user?.id) {
    throw new HttpError(401, "session_expired", "Your session expired, sign in again");
  }

  return player;
}

export async function renamePlayer(player: Player, rawName: string) {
  const name = rawName.trim();
  if (!NAME_PATTERN.test(name)) {
    throw new HttpError(
      422,
      "invalid_name",
      "Use 3–20 characters: letters, numbers, dots, dashes or underscores",
    );
  }
  if (name === player.name) {
    return player;
  }
  try {
    const [updated] = await db
      .update(players)
      .set({ name, nameEdited: true })
      .where(eq(players.id, player.id))
      .returning();
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new HttpError(409, "name_taken", "That name is already taken");
    }
    throw error;
  }
}

export async function setAvatarKey(player: Player, avatarKey: string | null) {
  const [updated] = await db
    .update(players)
    .set({ avatarKey })
    .where(eq(players.id, player.id))
    .returning();
  return updated;
}
