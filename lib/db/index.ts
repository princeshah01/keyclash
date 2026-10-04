import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

function connectionString(url: string) {
  const parsed = new URL(url);
  parsed.searchParams.set("sslmode", "verify-full");
  return parsed.toString();
}

const globalForDb = globalThis as typeof globalThis & { keyclashPool?: Pool };

const pool =
  globalForDb.keyclashPool ??
  new Pool({
    connectionString: connectionString(env.databaseUrl),
    max: 10,
    idleTimeoutMillis: 10_000,
  });

if (!env.isProduction) {
  globalForDb.keyclashPool = pool;
}

attachDatabasePool(pool);

export const db = drizzle({ client: pool, schema, casing: "snake_case" });
