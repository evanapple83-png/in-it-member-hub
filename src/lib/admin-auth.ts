import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { admins } from "@/db/schema";
import { getDb, hasDatabase } from "@/db";
import { authOptions } from "@/lib/auth";

export async function requireAdminFromRequest() {
  if (!hasDatabase()) {
    return { ok: false as const, error: "Neon DATABASE_URL is not configured.", status: 503 };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "Admin authentication required.", status: 401 };
  }

  const db = getDb();
  const [admin] = await db.select({ id: admins.id }).from(admins).where(eq(admins.userId, session.user.id)).limit(1);
  if (!admin) return { ok: false as const, error: "Unauthorized admin route.", status: 403 };

  return { ok: true as const, session, db };
}
