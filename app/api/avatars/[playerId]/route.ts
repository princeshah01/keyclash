import { NextResponse } from "next/server";
import { handleError, json } from "@/lib/server/http";
import { findPlayer } from "@/lib/server/players";
import { avatars } from "@/lib/storage";

const SIGNED_URL_TTL = 60 * 60;

export async function GET(_request: Request, ctx: RouteContext<"/api/avatars/[playerId]">) {
  try {
    const { playerId } = await ctx.params;
    const player = await findPlayer(playerId);

    let target: string | null = null;
    if (player?.avatarKey) {
      target = await avatars.url(player.avatarKey, { expiresIn: SIGNED_URL_TTL });
    } else if (player?.image) {
      target = player.image;
    }

    if (!target) {
      return json({ error: { code: "not_found", message: "No avatar" } }, { status: 404 });
    }

    return NextResponse.redirect(target, {
      status: 307,
      headers: { "Cache-Control": "public, max-age=600, s-maxage=600" },
    });
  } catch (error) {
    return handleError(error);
  }
}
