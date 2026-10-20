import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { getRecentResults, recentResultsQuery } from "@/lib/server/results";

export async function GET(request: Request) {
  try {
    const player = await requirePlayer();
    const parsed = recentResultsQuery.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) {
      throw new HttpError(422, "invalid_query", zodMessage(parsed.error));
    }
    return json(await getRecentResults(player.id, parsed.data));
  } catch (error) {
    return handleError(error);
  }
}
