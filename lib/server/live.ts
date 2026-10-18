import { createRealtime, pgParam, rawSql } from "@neon/realtime/server";
import { env } from "@/lib/env";
import type { LeaderboardRange } from "./leaderboard";

export const realtime = createRealtime({
  secret: env.realtimeSecret,
  db: env.databaseName,
});

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GlobalBoardRow {
  accuracy: number;
  auth_user_id: string | null;
  avatar_key: string | null;
  consistency: number;
  created_at: Date;
  image: string | null;
  name: string;
  numbers: boolean;
  player_id: string;
  punctuation: boolean;
  rank: number;
  raw: number;
  total: number;
  wpm: number;
}

export interface RoomBoardRow {
  accuracy: number | null;
  achieved_at: Date | null;
  auth_user_id: string | null;
  avatar_key: string | null;
  consistency: number | null;
  image: string | null;
  joined_at: Date;
  name: string;
  numbers: boolean | null;
  player_id: string;
  punctuation: boolean | null;
  raw: number | null;
  wpm: number | null;
}

export function rangeStart(range: LeaderboardRange, now = new Date()) {
  if (range === "all") {
    return new Date(0);
  }
  const startOfDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(range === "daily" ? startOfDay : startOfDay - 6 * DAY_MS);
}

export function globalBoardQuery(input: {
  detail: string;
  limit: number;
  mode: string;
  playerId: string | null;
  since: Date;
}) {
  return rawSql<GlobalBoardRow>(
    `WITH best AS (
       SELECT DISTINCT ON (r.player_id)
         r.player_id, r.wpm, r.raw, r.accuracy, r.consistency, r.punctuation, r.numbers, r.created_at
       FROM results r
       WHERE r.mode = $1::test_mode AND r.mode_detail = $2 AND r.created_at >= $3
       ORDER BY r.player_id, r.wpm DESC, r.accuracy DESC, r.created_at ASC
     ),
     ranked AS (
       SELECT best.*,
         rank() OVER (ORDER BY best.wpm DESC, best.accuracy DESC)::int AS rank,
         count(*) OVER ()::int AS total
       FROM best
     )
     SELECT ranked.player_id, ranked.wpm, ranked.raw, ranked.accuracy, ranked.consistency,
       ranked.punctuation, ranked.numbers, ranked.created_at, ranked.rank, ranked.total,
       p.name, p.avatar_key, p.image, p.auth_user_id
     FROM ranked
     JOIN players p ON p.id = ranked.player_id
     WHERE ranked.rank <= $4 OR ranked.player_id = $5::uuid
     ORDER BY ranked.rank ASC, ranked.created_at ASC`,
    [input.mode, input.detail, pgParam.timestamptz(input.since), input.limit, input.playerId],
  );
}

export function roomBoardQuery(input: {
  detail: string;
  mode: string;
  roomId: string;
  viewerId: string;
}) {
  return rawSql<RoomBoardRow>(
    `SELECT m.player_id, m.joined_at, p.name, p.avatar_key, p.image, p.auth_user_id,
       b.wpm, b.raw, b.accuracy, b.consistency, b.punctuation, b.numbers, b.created_at AS achieved_at
     FROM room_members m
     JOIN players p ON p.id = m.player_id
     LEFT JOIN (
       SELECT DISTINCT ON (r.player_id)
         r.player_id, r.wpm, r.raw, r.accuracy, r.consistency, r.punctuation, r.numbers, r.created_at
       FROM results r
       JOIN room_members rm ON rm.player_id = r.player_id AND rm.room_id = $1::uuid
       WHERE r.mode = $2::test_mode AND r.mode_detail = $3
       ORDER BY r.player_id, r.wpm DESC, r.accuracy DESC, r.created_at ASC
     ) b ON b.player_id = m.player_id
     WHERE m.room_id = $1::uuid
       AND EXISTS (
         SELECT 1 FROM room_members viewer
         WHERE viewer.room_id = $1::uuid AND viewer.player_id = $4::uuid
       )`,
    [input.roomId, input.mode, input.detail, input.viewerId],
  );
}
