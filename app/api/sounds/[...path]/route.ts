import { handleError, json } from "@/lib/server/http";
import { SOUND_KEYS } from "@/lib/sounds/catalog";
import { sounds } from "@/lib/storage";

export async function GET(_request: Request, ctx: RouteContext<"/api/sounds/[...path]">) {
  try {
    const key = (await ctx.params).path.join("/");
    if (!SOUND_KEYS.has(key)) {
      return json({ error: { code: "not_found", message: "Unknown sound" } }, { status: 404 });
    }
    const file = await sounds.download(key);
    return new Response(await file.arrayBuffer(), {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
