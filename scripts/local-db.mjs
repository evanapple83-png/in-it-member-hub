import nextEnv from "@next/env";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

nextEnv.loadEnvConfig(process.cwd(), true);
const url = process.env.DATABASE_URL;
if (!url || !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)) {
  throw new Error("Local setup requires a loopback DATABASE_URL. Copy .env.local.example to .env.local first.");
}

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  // Apply the checked-in SQL, including triggers and rate_limits not represented by db:push.
  await client.query("create table if not exists local_dev_migrations (name text primary key, applied_at timestamptz not null default now())");
  const directory = new URL("../drizzle/", import.meta.url);
  const files = (await readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  for (const name of files) {
    const { rowCount } = await client.query("select name from local_dev_migrations where name = $1", [name]);
    if (rowCount) continue;
    await client.query("begin");
    try {
      await client.query(await readFile(new URL(name, directory), "utf8"));
      await client.query("insert into local_dev_migrations (name) values ($1)", [name]);
      await client.query("commit");
      console.log(`Applied ${name}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
  await client.query("begin");
  try {
    for (const path of ["../drizzle/seed.sql", "../drizzle/seed-local.sql", "../drizzle/seed-it-members.sql"]) {
      await client.query(await readFile(fileURLToPath(new URL(path, import.meta.url)), "utf8"));
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
  console.log("Local database ready. Run npm run dev and open http://localhost:3000/inloggen.");
} finally {
  await client.end();
}
