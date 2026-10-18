import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { leaderboardQuery } from "@/lib/server/leaderboard";
import { globalBoardQuery, rangeStart, realtime } from "@/lib/server/live";
import { readPlayerId } from "@/lib/server/players";

export async function POST(request: Request) {
  try {
    const parsed = leaderboardQuery.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_query", zodMessage(parsed.error));
    }
    const { mode, detail, range, limit } = parsed.data;
    const sealed = await realtime.seal({
      query: globalBoardQuery({
        mode,
        detail,
        limit,
        since: rangeStart(range),
        playerId: await readPlayerId(),
      }),
    });
    return json(sealed);
  } catch (error) {
    return handleError(error);
  }
}
