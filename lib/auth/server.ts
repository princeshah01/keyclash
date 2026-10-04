import { createNeonAuth } from "@neondatabase/auth/next/server";
import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env.authBaseUrl,
  cookies: {
    secret: env.authCookieSecret,
  },
});

export async function getSessionUser() {
  const { data } = await auth.getSession();
  return data?.user ?? null;
}
