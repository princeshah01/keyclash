import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { type Player, results } from "@/lib/db/schema";
import {
  DIFFICULTIES,
  isRanked,
  QUOTE_LENGTHS,
  RANKED_MODES,
  TEST_MODES,
  TIME_OPTIONS,
  WORD_OPTIONS,
} from "@/lib/typing/options";
import { validateResult } from "@/lib/typing/validate";
import { HttpError } from "./http";
import { rankFor } from "./leaderboard";

export const recentResultsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  /** First result id of this page (inclusive). Omit for the newest page. */
  cursor: z.string().uuid().optional(),
});

const count = z.number().int().min(0).max(20_000);

export const resultInput = z.object({
  mode: z.enum(TEST_MODES),
  modeDetail: z.string().max(12),
  punctuation: z.boolean(),
  numbers: z.boolean(),
  difficulty: z.enum(DIFFICULTIES).nullable(),
  wpm: z.number().int().min(0).max(1000),
  raw: z.number().int().min(0).max(1000),
  accuracy: z.number().int().min(0).max(100),
  consistency: z.number().int().min(0).max(100),
  correctChars: count,
  incorrectChars: count,
  extraChars: count,
  missedChars: count,
  correctedErrors: count,
  elapsedSeconds: z.number().int().min(0).max(3600),
  wpmHistory: z
    .array(
      z.object({
        second: z.number().int().min(0).max(3600),
        wpm: z.number().int().min(0).max(2000),
        raw: z.number().int().min(0).max(2000),
        errors: z.number().int().min(0).max(1000),
      }),
    )
    .max(600),
});

export type ResultInput = z.infer<typeof resultInput>;

const MIN_SECONDS_BETWEEN_RESULTS = 2;

function assertDetailMatchesMode(input: ResultInput) {
  const { mode, modeDetail, elapsedSeconds } = input;
  const allowed: Record<ResultInput["mode"], readonly string[]> = {
    time: TIME_OPTIONS.map(String),
    words: WORD_OPTIONS.map(String),
    quote: QUOTE_LENGTHS,
    zen: [""],
  };
  if (!allowed[mode].includes(modeDetail)) {
    throw new HttpError(422, "invalid_detail", `"${modeDetail}" is not a valid ${mode} option`);
  }
  if (mode === "time" && Math.abs(elapsedSeconds - Number(modeDetail)) > 2) {
    throw new HttpError(422, "invalid_duration", "Elapsed time does not match the test length");
  }
}

async function assertNotFlooding(playerId: string) {
  const [latest] = await db
    .select({ createdAt: results.createdAt })
    .from(results)
    .where(eq(results.playerId, playerId))
    .orderBy(desc(results.createdAt))
    .limit(1);
  if (latest && Date.now() - latest.createdAt.getTime() < MIN_SECONDS_BETWEEN_RESULTS * 1000) {
    throw new HttpError(429, "too_many_results", "Slow down, results are coming in too fast");
  }
}

async function personalBest(playerId: string, mode: ResultInput["mode"], modeDetail: string) {
  const [best] = await db
    .select({ wpm: results.wpm, accuracy: results.accuracy })
    .from(results)
    .where(
      and(
        eq(results.playerId, playerId),
        eq(results.mode, mode),
        eq(results.modeDetail, modeDetail),
      ),
    )
    .orderBy(desc(results.wpm), desc(results.accuracy))
    .limit(1);
  return best ?? null;
}

export async function saveResult(player: Player, input: ResultInput) {
  assertDetailMatchesMode(input);

  const validation = validateResult(input);
  if (!validation.valid) {
    throw new HttpError(422, validation.reason, "This result failed validation");
  }

  await assertNotFlooding(player.id);
  const previousBest = await personalBest(player.id, input.mode, input.modeDetail);

  const [saved] = await db
    .insert(results)
    .values({
      playerId: player.id,
      mode: input.mode,
      modeDetail: input.modeDetail,
      punctuation: input.punctuation,
      numbers: input.numbers,
      difficulty: input.difficulty,
      wpm: input.wpm,
      raw: input.raw,
      accuracy: input.accuracy,
      consistency: input.consistency,
      correctChars: input.correctChars,
      incorrectChars: input.incorrectChars,
      extraChars: input.extraChars,
      missedChars: input.missedChars,
      correctedErrors: input.correctedErrors,
      elapsedSeconds: input.elapsedSeconds,
      history: input.wpmHistory,
    })
    .returning({ id: results.id, createdAt: results.createdAt });

  const ranked = isRanked(input.mode, input.modeDetail);
  const rank = ranked ? await rankFor(player.id, input.mode, input.modeDetail) : null;

  return {
    id: saved.id,
    createdAt: saved.createdAt,
    isPersonalBest:
      !previousBest ||
      input.wpm > previousBest.wpm ||
      (input.wpm === previousBest.wpm && input.accuracy > previousBest.accuracy),
    previousBest,
    ranked,
    rank,
  };
}

const recentSelect = {
  id: results.id,
  mode: results.mode,
  modeDetail: results.modeDetail,
  punctuation: results.punctuation,
  numbers: results.numbers,
  wpm: results.wpm,
  raw: results.raw,
  accuracy: results.accuracy,
  consistency: results.consistency,
  elapsedSeconds: results.elapsedSeconds,
  createdAt: results.createdAt,
} as const;

export async function getPlayerStats(playerId: string) {
  const [totals] = await db
    .select({
      tests: sql<number>`count(*)::int`,
      secondsTyped: sql<number>`coalesce(sum(${results.elapsedSeconds}), 0)::int`,
      averageWpm: sql<number>`coalesce(round(avg(${results.wpm})), 0)::int`,
      averageAccuracy: sql<number>`coalesce(round(avg(${results.accuracy})), 0)::int`,
      bestWpm: sql<number>`coalesce(max(${results.wpm}), 0)::int`,
    })
    .from(results)
    .where(eq(results.playerId, playerId));

  const bests = await db
    .selectDistinctOn([results.mode, results.modeDetail], {
      mode: results.mode,
      modeDetail: results.modeDetail,
      wpm: results.wpm,
      accuracy: results.accuracy,
      createdAt: results.createdAt,
    })
    .from(results)
    .where(and(eq(results.playerId, playerId), inArray(results.mode, [...RANKED_MODES])))
    .orderBy(results.mode, results.modeDetail, desc(results.wpm), desc(results.accuracy));

  return { totals, bests };
}

export async function getRecentResults(
  playerId: string,
  input: z.infer<typeof recentResultsQuery>,
) {
  const { limit, cursor } = input;

  let cursorFilter: ReturnType<typeof sql> | undefined;
  if (cursor) {
    const [anchor] = await db
      .select({ id: results.id, createdAt: results.createdAt })
      .from(results)
      .where(and(eq(results.playerId, playerId), eq(results.id, cursor)))
      .limit(1);
    if (!anchor) {
      throw new HttpError(404, "cursor_not_found", "That page no longer exists");
    }
    // Inclusive start: this id is the first row of the requested page.
    cursorFilter = sql`(${results.createdAt}, ${results.id}) <= (${anchor.createdAt}, ${anchor.id}::uuid)`;
  }

  const rows = await db
    .select(recentSelect)
    .from(results)
    .where(
      cursorFilter
        ? and(eq(results.playerId, playerId), cursorFilter)
        : eq(results.playerId, playerId),
    )
    .orderBy(desc(results.createdAt), desc(results.id))
    .limit(limit + 1);

  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? rows[limit]!.id : null;

  return { results: page, nextCursor };
}
