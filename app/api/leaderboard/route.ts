import type { NextRequest } from "next/server";
import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { getLeaderboard, leaderboardQuery } from "@/lib/server/leaderboard";
import { readPlayerId } from "@/lib/server/players";

export async function GET(request: NextRequest) {
  try {
    const parsed = leaderboardQuery.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_query", zodMessage(parsed.error));
    }
    return json(await getLeaderboard(parsed.data, await readPlayerId()));
  } catch (error) {
    return handleError(error);
  }
}
