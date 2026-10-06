import { handleError, json } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { getPlayerStats } from "@/lib/server/results";

export async function GET() {
  try {
    const player = await requirePlayer();
    return json(await getPlayerStats(player.id));
  } catch (error) {
    return handleError(error);
  }
}
