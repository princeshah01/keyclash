import { handleError, json } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { joinRoom, leaveRoom } from "@/lib/server/rooms";

export async function POST(_request: Request, ctx: RouteContext<"/api/rooms/[code]/members">) {
  try {
    const { code } = await ctx.params;
    const room = await joinRoom(await requirePlayer(), code);
    return json({ room: { code: room.code, name: room.name } });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/rooms/[code]/members">) {
  try {
    const { code } = await ctx.params;
    await leaveRoom(await requirePlayer(), code);
    return json({ left: code });
  } catch (error) {
    return handleError(error);
  }
}
