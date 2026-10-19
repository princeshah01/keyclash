import { handleError, json } from "@/lib/server/http";
import { readPlayerId } from "@/lib/server/players";
import { previewRoom } from "@/lib/server/rooms";

export async function GET(_request: Request, ctx: RouteContext<"/api/rooms/[code]">) {
  try {
    const { code } = await ctx.params;
    return json({ room: await previewRoom(code, await readPlayerId()) });
  } catch (error) {
    return handleError(error);
  }
}
