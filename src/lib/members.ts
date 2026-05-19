import { approvedSeedMembers, seedMembers } from "@/lib/seed-members";
import { members } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { memberFromRow } from "@/db/mapper";
import { publicMembers } from "@/lib/member-utils";
import type { Member } from "@/lib/types";

export async function getPublicMembers(): Promise<Member[]> {
  if (!hasDatabase()) {
    return approvedSeedMembers;
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(members)
      .where(and(eq(members.visibilityStatus, "approved"), eq(members.consentGiven, true)))
      .orderBy(desc(members.createdAt));
    return rows.map(memberFromRow);
  } catch {
    return approvedSeedMembers;
  }
}

export async function getPublicMember(id: string): Promise<Member | null> {
  const members = await getPublicMembers();
  return members.find((member) => member.id === id) ?? null;
}

export async function getAllMembersForAdmin(): Promise<Member[]> {
  if (!hasDatabase()) {
    return seedMembers;
  }

  try {
    const db = getDb();
    const rows = await db.select().from(members).orderBy(desc(members.createdAt));
    return rows.map(memberFromRow);
  } catch {
    return seedMembers;
  }
}

export { publicMembers };
