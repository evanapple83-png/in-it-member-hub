import { neon } from "@neondatabase/serverless";
import { drizzle as neonDrizzle, type NeonHttpQueryResultHKT } from "drizzle-orm/neon-http";
import { drizzle as postgresDrizzle, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "@/db/schema";

const local = globalThis as typeof globalThis & { localPostgresPool?: Pool };

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): PgDatabase<NodePgQueryResultHKT | NeonHttpQueryResultHKT, typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }

  const hostname = new URL(url).hostname;
  if (["localhost", "127.0.0.1", "[::1]"].includes(hostname)) {
    local.localPostgresPool ??= new Pool({ connectionString: url });
    return postgresDrizzle(local.localPostgresPool, { schema });
  }

  return neonDrizzle(neon(url), { schema });
}
