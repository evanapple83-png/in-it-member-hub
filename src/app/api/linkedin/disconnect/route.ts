import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export async function POST() {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon DATABASE_URL is not configured." }, { status: 503 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await getDb().delete(linkedinAccounts).where(eq(linkedinAccounts.userId, session.user.id));
  return NextResponse.json({ ok: true });
}
