import { and, count, desc, eq, gt, inArray, isNotNull } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { accessRequestFromRow, memberFromRow } from "@/db/mapper";
import { accessRequests, admins, invites, members } from "@/db/schema";
import type { AccessRequest, Member } from "@/lib/types";

export type AdminInvite = {
  id: string;
  email: string | null;
  note: string | null;
  status: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by?: string | null;
};

export type RecentItem = { id: string; text: string; at: string };

export type ReviewQueue = { pendingMembers: Member[]; openRequests: AccessRequest[] };

function inviteFromRow(row: typeof invites.$inferSelect): AdminInvite {
  return {
    id: row.id,
    email: row.email,
    note: row.note,
    // An "active" code past its expiry is shown as expired, without rewriting the row.
    status: row.status === "active" && row.expiresAt.getTime() < Date.now() ? "expired" : row.status,
    expires_at: row.expiresAt.toISOString(),
    used_at: row.usedAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}

// Accounts waiting for review: pending members that finished consent + onboarding
// (an account that stopped halfway is not something the coordinator can judge yet).
export async function getReviewQueue(): Promise<ReviewQueue> {
  if (!hasDatabase()) return { pendingMembers: [], openRequests: [] };
  const db = getDb();
  const [memberRows, requestRows] = await Promise.all([
    db
      .select()
      .from(members)
      .where(and(eq(members.visibilityStatus, "pending"), eq(members.consentGiven, true), eq(members.onboardingCompleted, true)))
      .orderBy(desc(members.createdAt)),
    db.select().from(accessRequests).where(eq(accessRequests.status, "requested")).orderBy(desc(accessRequests.createdAt)),
  ]);
  return { pendingMembers: memberRows.map(memberFromRow), openRequests: requestRows.map(accessRequestFromRow) };
}

export async function listInvitesForAdmin(): Promise<AdminInvite[]> {
  if (!hasDatabase()) return [];
  const rows = await getDb()
    .select({ invite: invites, by: members.fullName })
    .from(invites)
    .leftJoin(admins, eq(invites.createdByAdminId, admins.id))
    .leftJoin(members, eq(members.userId, admins.userId))
    .orderBy(desc(invites.createdAt));
  // One admin row could in theory match several members; keep the first per invite.
  const seen = new Set<string>();
  return rows.flatMap(({ invite, by }) => {
    if (seen.has(invite.id)) return [];
    seen.add(invite.id);
    return [{ ...inviteFromRow(invite), created_by: by }];
  });
}

export type AdminMemberRow = Member & { is_admin: boolean };

export async function listMembersForAdmin(): Promise<AdminMemberRow[]> {
  if (!hasDatabase()) return [];
  const db = getDb();
  const [rows, adminRows] = await Promise.all([
    db.select().from(members).orderBy(desc(members.createdAt)),
    db.select({ userId: admins.userId }).from(admins),
  ]);
  const adminUsers = new Set(adminRows.map((a) => a.userId));
  return rows.map((row) => ({ ...memberFromRow(row), is_admin: Boolean(row.userId && adminUsers.has(row.userId)) }));
}

// Overzicht: counts, the review queue, the newest active codes and a "Recent" feed built from
// real timestamps (reviews, new codes, new requests). Nothing here is a stored activity log.
export async function getAdminOverview() {
  const queue = await getReviewQueue();
  if (!hasDatabase()) {
    return { ...queue, generatedAt: Date.now(), memberCount: 0, activeCodes: [] as AdminInvite[], activeCodeCount: 0, recent: [] as RecentItem[] };
  }
  const db = getDb();
  const now = new Date();
  const [[memberCount], [activeCount], activeRows, reviewedMembers, reviewedRequests, newRequests, newInvites] = await Promise.all([
    db.select({ n: count() }).from(members).where(eq(members.visibilityStatus, "approved")),
    db.select({ n: count() }).from(invites).where(and(eq(invites.status, "active"), gt(invites.expiresAt, now))),
    db
      .select()
      .from(invites)
      .where(and(eq(invites.status, "active"), gt(invites.expiresAt, now)))
      .orderBy(desc(invites.createdAt))
      .limit(3),
    db
      .select({
        id: members.id,
        name: members.fullName,
        status: members.visibilityStatus,
        created: members.createdAt,
        updated: members.updatedAt,
      })
      .from(members)
      // Approved members are left out: any later profile edit bumps updated_at, so it is no
      // reliable approval moment. Pending uses the sign-up time, rejected/deactivated the change.
      .where(and(eq(members.onboardingCompleted, true), inArray(members.visibilityStatus, ["pending", "rejected", "deactivated"])))
      .orderBy(desc(members.updatedAt))
      .limit(8),
    db
      .select({ id: accessRequests.id, name: accessRequests.fullName, status: accessRequests.status, at: accessRequests.reviewedAt })
      .from(accessRequests)
      .where(isNotNull(accessRequests.reviewedAt))
      .orderBy(desc(accessRequests.reviewedAt))
      .limit(5),
    db
      .select({ id: accessRequests.id, name: accessRequests.fullName, at: accessRequests.createdAt })
      .from(accessRequests)
      .orderBy(desc(accessRequests.createdAt))
      .limit(5),
    db
      .select({ id: invites.id, email: invites.email, note: invites.note, at: invites.createdAt })
      .from(invites)
      .orderBy(desc(invites.createdAt))
      .limit(5),
  ]);

  const memberVerb: Record<string, string> = {
    rejected: "afgewezen",
    pending: "wacht op goedkeuring",
    deactivated: "gedeactiveerd",
  };

  const recent: RecentItem[] = [
    ...reviewedMembers.map((m) => ({
      id: `m-${m.id}`,
      text: `${m.name} ${memberVerb[m.status] ?? "bijgewerkt"}`,
      at: (m.status === "pending" ? m.created : m.updated).toISOString(),
    })),
    ...reviewedRequests.map((r) => ({
      id: `r-${r.id}`,
      text: `Aanvraag van ${r.name} ${r.status === "approved" ? "goedgekeurd" : "afgewezen"}`,
      at: (r.at ?? now).toISOString(),
    })),
    ...newRequests.map((r) => ({ id: `n-${r.id}`, text: `${r.name} vroeg toegang aan`, at: r.at.toISOString() })),
    ...newInvites.map((i) => ({
      id: `i-${i.id}`,
      text: i.email ? `Code gemaakt voor ${i.email}` : i.note ? `Code gemaakt: ${i.note}` : "Code gemaakt",
      at: i.at.toISOString(),
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  return {
    ...queue,
    generatedAt: now.getTime(),
    memberCount: Number(memberCount?.n ?? 0),
    activeCodeCount: Number(activeCount?.n ?? 0),
    activeCodes: activeRows.map(inviteFromRow),
    recent,
  };
}
