import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, hasDatabase } from "@/db";

// Client IP as Vercel reports it (the first x-forwarded-for hop is set by the edge, not the client).
export function clientIp(request: Request) {
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/**
 * Fixed-window counter in Postgres (table from drizzle/0009). Returns true while the caller is
 * under `limit` hits per `windowSeconds`. Fails open: if the table or database is unavailable
 * the request goes through, so a missing migration never locks members out.
 */
export async function underLimit(key: string, limit: number, windowSeconds: number) {
  if (!hasDatabase()) return true;
  try {
    const result = await getDb().execute(sql`
      insert into rate_limits (key, window_start, count) values (${key}, now(), 1)
      on conflict (key) do update set
        count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then 1 else rate_limits.count + 1 end,
        window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) then now() else rate_limits.window_start end
      returning count
    `);
    const count = Number((result.rows[0] as { count?: number } | undefined)?.count ?? 0);
    return count <= limit;
  } catch (error) {
    console.error("rate limit check failed", error);
    return true;
  }
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: "Je hebt dit te vaak geprobeerd. Wacht even en probeer het dan opnieuw." },
    { status: 429, headers: { "Retry-After": "600" } },
  );
}
