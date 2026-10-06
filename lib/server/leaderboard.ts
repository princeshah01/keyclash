import { type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { RANKED_DETAILS, RANKED_MODES } from "@/lib/typing/options";
import { avatarUrlFor } from "./players";

export const LEADERBOARD_RANGES = ["all", "weekly", "daily"] as const;
export type LeaderboardRange = (typeof LEADERBOARD_RANGES)[number];

const RANGE_INTERVAL: Record<LeaderboardRange, string | null> = {
  all: null,
  weekly: "7 days",
  daily: "1 day",
};

export const leaderboardQuery = z
  .object({
    mode: z.enum(RANKED_MODES).default("time"),
    detail: z.string().default("30"),
    range: z.enum(LEADERBOARD_RANGES).default("all"),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((query) => RANKED_DETAILS[query.mode].includes(query.detail), {
    message: "Unknown leaderboard",
    path: ["detail"],
  });

export type LeaderboardQuery = z.infer<typeof leaderboardQuery>;

interface RankedRow extends Record<string, unknown> {
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

function rankedBest(mode: string, detail: string, range: LeaderboardRange): SQL {
  const interval = RANGE_INTERVAL[range];
  const since = interval ? sql`and r.created_at >= now() - ${interval}::interval` : sql``;
  return sql`
    with best as (
      select distinct on (r.player_id)
        r.player_id, r.wpm, r.raw, r.accuracy, r.consistency,
        r.punctuation, r.numbers, r.created_at
      from results r
      where r.mode = ${mode} and r.mode_detail = ${detail} ${since}
      order by r.player_id, r.wpm desc, r.accuracy desc, r.created_at asc
    ),
    ranked as (
      select best.*,
        rank() over (order by best.wpm desc, best.accuracy desc)::int as rank,
        count(*) over ()::int as total
      from best
    )
  `;
}

export async function getLeaderboard(query: LeaderboardQuery, playerId: string | null) {
  const { rows } = await db.execute<RankedRow>(sql`
    ${rankedBest(query.mode, query.detail, query.range)}
    select ranked.*, p.name, p.avatar_key, p.image, p.auth_user_id
    from ranked
    join players p on p.id = ranked.player_id
    where ranked.rank <= ${query.limit} or ranked.player_id = ${playerId}::uuid
    order by ranked.rank asc, ranked.created_at asc
  `);

  const entries = rows.map((row) => ({
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
    createdAt: new Date(row.created_at).toISOString(),
  }));

  return {
    ...query,
    total: rows[0]?.total ?? 0,
    entries: entries.filter((entry) => entry.rank <= query.limit),
    me: entries.find((entry) => entry.playerId === playerId) ?? null,
  };
}

export async function rankFor(playerId: string, mode: string, detail: string) {
  const { rows } = await db.execute<{ rank: number; total: number }>(sql`
    ${rankedBest(mode, detail, "all")}
    select rank, total from ranked where player_id = ${playerId}::uuid
  `);
  return rows[0] ?? null;
}
