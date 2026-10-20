"use client";

import { avatarUrlFor } from "@/lib/avatar";
import type { LeaderboardEntry } from "@/lib/client/types";
import type { GlobalBoardRow, RoomBoardRow } from "@/lib/server/live";

export type { GlobalBoardRow, RoomBoardRow };

function toIso(value: Date | string | null) {
  if (!value) {
    return new Date(0).toISOString();
  }
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function globalRowToEntry(row: GlobalBoardRow): LeaderboardEntry {
  return {
    rank: row.rank,
    playerId: row.player_id,
    name: row.name,
    avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
    isGuest: row.auth_user_id === null,
    wpm: row.wpm,
    raw: row.raw,
    accuracy: row.accuracy,
    consistency: row.consistency,
    punctuation: row.punctuation,
    numbers: row.numbers,
    createdAt: toIso(row.created_at),
  };
}

export interface RoomStanding {
  pending: { avatarUrl: string | null; name: string; playerId: string }[];
  ranked: LeaderboardEntry[];
}

export function rankRoomRows(rows: readonly RoomBoardRow[]): RoomStanding {
  const scored = rows
    .filter((row) => row.wpm !== null)
    .sort(
      (a, b) =>
        (b.wpm ?? 0) - (a.wpm ?? 0) ||
        (b.accuracy ?? 0) - (a.accuracy ?? 0) ||
        new Date(toIso(a.achieved_at)).getTime() - new Date(toIso(b.achieved_at)).getTime(),
    );

  const ranked: LeaderboardEntry[] = [];
  scored.forEach((row, index) => {
    const previous = ranked[index - 1];
    const tied = previous && previous.wpm === row.wpm && previous.accuracy === (row.accuracy ?? 0);
    ranked.push({
      rank: tied ? previous.rank : index + 1,
      playerId: row.player_id,
      name: row.name,
      avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
      isGuest: row.auth_user_id === null,
      wpm: row.wpm ?? 0,
      raw: row.raw ?? 0,
      accuracy: row.accuracy ?? 0,
      consistency: row.consistency ?? 0,
      punctuation: row.punctuation ?? false,
      numbers: row.numbers ?? false,
      createdAt: toIso(row.achieved_at),
    });
  });

  const pending = rows
    .filter((row) => row.wpm === null)
    .sort((a, b) => toIso(a.joined_at).localeCompare(toIso(b.joined_at)))
    .map((row) => ({
      playerId: row.player_id,
      name: row.name,
      avatarUrl: avatarUrlFor({ id: row.player_id, avatarKey: row.avatar_key, image: row.image }),
    }));

  return { ranked, pending };
}
