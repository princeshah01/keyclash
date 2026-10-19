import { handleError, json } from "@/lib/server/http";
import { requirePlayer } from "@/lib/server/players";
import { leaveAllRooms } from "@/lib/server/rooms";

export async function DELETE() {
  try {
    const left = await leaveAllRooms(await requirePlayer());
    return json({ left });
  } catch (error) {
    return handleError(error);
  }
}
