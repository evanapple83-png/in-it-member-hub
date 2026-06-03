import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { admins } from "@/db/schema";
import { getDb, hasDatabase } from "@/db";
import { authOptions } from "@/lib/auth";

export async function requireAdminFromRequest() {
  if (!hasDatabase()) {
    return { ok: false as const, error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw.", status: 503 };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false as const, error: "Admin authentication required.", status: 401 };
  }

  const db = getDb();
  const [admin] = await db
    .select({ id: admins.id, role: admins.role })
    .from(admins)
    .where(eq(admins.userId, session.user.id))
    .limit(1);
  if (!admin) return { ok: false as const, error: "Unauthorized admin route.", status: 403 };

  return { ok: true as const, session, db, adminId: admin.id, role: admin.role };
}

// Lightweight read of the current user's admin role (or null). For server components and
// routes that need to know "is this user an admin/coordinator?" without enforcing it.
export async function getCurrentAdminRole(): Promise<string | null> {
  if (!hasDatabase()) return null;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const db = getDb();
  const [admin] = await db.select({ role: admins.role }).from(admins).where(eq(admins.userId, session.user.id)).limit(1);
  return admin?.role ?? null;
}
