import { parseEnv } from "@neon/env";
import { z } from "zod";
import neonConfig from "@/neon";

const neon = parseEnv(neonConfig, ["DATABASE_URL", "NEON_AUTH_BASE_URL"]);

const app = z
  .object({
    NEON_AUTH_COOKIE_SECRET: z.string().min(32),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  })
  .parse(process.env);

export const env = {
  databaseUrl: neon.postgres.databaseUrl,
  authBaseUrl: neon.auth.baseUrl,
  authCookieSecret: app.NEON_AUTH_COOKIE_SECRET,
  isProduction: app.NODE_ENV === "production",
};
