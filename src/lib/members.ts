import { approvedSeedMembers, seedMembers } from "@/lib/seed-members";
import { members } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { memberFromRow } from "@/db/mapper";
import { publicMembers } from "@/lib/member-utils";
import type { Member } from "@/lib/types";
import { toPublicProfile, type PublicProfile } from "@/lib/public-profile";

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

// FR-002/013: a profile visible to non-logged-in visitors — only when the member opted in
// (approved + consent + at least one public field). The page renders only public fields.
export async function getPublicProfiles(): Promise<PublicProfile[]> {
  let candidates: Member[];
  if (!hasDatabase()) candidates = approvedSeedMembers;
  else {
    // Do not substitute demo identities if a configured database fails.
    const rows = await getDb().select().from(members)
      .where(and(eq(members.visibilityStatus, "approved"), eq(members.consentGiven, true)))
      .orderBy(desc(members.createdAt));
    candidates = rows.map(memberFromRow);
  }
  return candidates.map(toPublicProfile).filter((member): member is PublicProfile => member !== null);
}

export async function getPublicProfile(id: string): Promise<PublicProfile | null> {
  return (await getPublicProfiles()).find((member) => member.id === id) ?? null;
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
