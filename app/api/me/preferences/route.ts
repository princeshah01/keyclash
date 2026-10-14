import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { requirePlayer, savePreferences, toPublicPlayer } from "@/lib/server/players";
import { preferencesSchema } from "@/lib/settings/options";

export async function PUT(request: Request) {
  try {
    const parsed = preferencesSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_preferences", zodMessage(parsed.error));
    }
    const player = await savePreferences(await requirePlayer(), parsed.data);
    return json({ player: toPublicPlayer(player) });
  } catch (error) {
    return handleError(error);
  }
}
