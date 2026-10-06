import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { resultInput, saveResult } from "@/lib/server/results";

export async function POST(request: Request) {
  try {
    const parsed = resultInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_body", zodMessage(parsed.error));
    }
    const player = await requirePlayer();
    return json({ result: await saveResult(player, parsed.data) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
