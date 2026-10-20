import { handleError, json } from "@/lib/server/http";
import { realtime, thockTotalQuery } from "@/lib/server/live";

export async function POST() {
  try {
    return json(await realtime.seal({ query: thockTotalQuery() }));
  } catch (error) {
    return handleError(error);
  }
}
