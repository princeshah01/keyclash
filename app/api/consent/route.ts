import { cookies } from "next/headers";
import { z } from "zod";
import { CONSENT_COOKIE, CONSENT_VALUES } from "@/lib/client/consent";
import { cookieDefaults, HttpError, handleError, json, zodMessage } from "@/lib/server/http";

const consentInput = z.object({ value: z.enum(CONSENT_VALUES) });

export async function POST(request: Request) {
  try {
    const parsed = consentInput.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      throw new HttpError(422, "invalid_body", zodMessage(parsed.error));
    }
    const store = await cookies();
    store.set(CONSENT_COOKIE, parsed.data.value, {
      httpOnly: false,
      ...(await cookieDefaults(365)),
    });
    return json({ consent: parsed.data.value });
  } catch (error) {
    return handleError(error);
  }
}
