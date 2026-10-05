import { z } from "zod";
import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { renamePlayer, requirePlayer, resolvePlayer, toPublicPlayer } from "@/lib/server/players";

const renameInput = z.object({ name: z.string().max(64) });

export async function GET() {
  try {
    const player = await resolvePlayer();
    return json({ player: toPublicPlayer(player) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = renameInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_body", zodMessage(parsed.error));
    }
    const player = await renamePlayer(await requirePlayer(), parsed.data.name);
    return json({ player: toPublicPlayer(player) });
  } catch (error) {
    return handleError(error);
  }
}
