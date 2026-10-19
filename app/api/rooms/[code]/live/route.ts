import { z } from "zod";
import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { realtime, roomBoardQuery } from "@/lib/server/live";
import { requirePlayer } from "@/lib/server/players";
import { requireMembership } from "@/lib/server/rooms";
import { RANKED_DETAILS, RANKED_MODES } from "@/lib/typing/options";

const boardInput = z
  .object({ mode: z.enum(RANKED_MODES), detail: z.string() })
  .refine((input) => RANKED_DETAILS[input.mode].includes(input.detail), {
    message: "Unknown test",
    path: ["detail"],
  });

export async function POST(request: Request, ctx: RouteContext<"/api/rooms/[code]/live">) {
  try {
    const parsed = boardInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_board", zodMessage(parsed.error));
    }
    const { code } = await ctx.params;
    const player = await requirePlayer();
    const room = await requireMembership(player, code);
    const sealed = await realtime.seal({
      query: roomBoardQuery({ roomId: room.id, viewerId: player.id, ...parsed.data }),
    });
    return json(sealed);
  } catch (error) {
    return handleError(error);
  }
}
