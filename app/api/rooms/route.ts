import { HttpError, handleError, json, zodMessage } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { createRoom, listRooms, roomInput } from "@/lib/server/rooms";

export async function GET() {
  try {
    const player = await requirePlayer();
    return json({ rooms: await listRooms(player.id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const parsed = roomInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_room", zodMessage(parsed.error));
    }
    const player = await requirePlayer();
    const room = await createRoom(player, parsed.data.name);
    return json({ room: { code: room.code, name: room.name } }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
