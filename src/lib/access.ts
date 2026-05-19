import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { getDb, hasDatabase } from "@/db";
import { memberFromRow } from "@/db/mapper";
import { members } from "@/db/schema";
import { authOptions } from "@/lib/auth";

export async function getCurrentMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !hasDatabase()) return null;

  const db = getDb();
  const [member] = await db.select().from(members).where(eq(members.userId, session.user.id)).limit(1);
  return member ? memberFromRow(member) : null;
}

export async function getApprovedCurrentMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !hasDatabase()) return null;

  const db = getDb();
  const [member] = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, session.user.id), eq(members.visibilityStatus, "approved"), eq(members.consentGiven, true)))
    .limit(1);

  return member ? memberFromRow(member) : null;
}

export async function isApprovedMember() {
  return Boolean(await getApprovedCurrentMember());
}
