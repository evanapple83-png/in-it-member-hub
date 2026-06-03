import { desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { accessRequestFromRow } from "@/db/mapper";
import { accessRequests, invites } from "@/db/schema";
import { activationEmail, sendEmail } from "@/lib/email";
import { generateInviteCode, hashInviteCode } from "@/lib/invites";
import type { AccessRequest, MemberType } from "@/lib/types";

export type CreateAccessRequestInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  requesterType: MemberType;
  motivation?: string | null;
  linkedinUrl?: string | null;
  proposedByMemberId?: string | null;
};

export async function createAccessRequest(input: CreateAccessRequestInput): Promise<AccessRequest> {
  const db = getDb();
  const [row] = await db
    .insert(accessRequests)
    .values({
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      requesterType: input.requesterType,
      motivation: input.motivation ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      proposedByMemberId: input.proposedByMemberId ?? null,
    })
    .returning();
  return accessRequestFromRow(row);
}

export async function listAccessRequests(): Promise<AccessRequest[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db.select().from(accessRequests).orderBy(desc(accessRequests.createdAt));
    return rows.map(accessRequestFromRow);
  } catch {
    return [];
  }
}

type ReviewResult =
  | { ok: false; error: string }
  | { ok: true; request: AccessRequest; code?: string; emailed?: boolean };

// FR-006: approving a request mints a one-time 24h invite, links it to the request for the
// audit trail, and emails the activation code to the applicant.
export async function approveAccessRequest(id: string, adminId: string): Promise<ReviewResult> {
  const db = getDb();
  const [existing] = await db.select().from(accessRequests).where(eq(accessRequests.id, id)).limit(1);
  if (!existing) return { ok: false, error: "Access request not found." };
  if (existing.status === "approved") return { ok: false, error: "This request is already approved." };

  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [invite] = await db
    .insert(invites)
    .values({
      codeHash: hashInviteCode(code),
      email: existing.email,
      note: `Access request ${existing.fullName}`,
      expiresAt,
      createdByAdminId: adminId,
    })
    .returning();

  const [updated] = await db
    .update(accessRequests)
    .set({
      status: "approved",
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
      inviteId: invite.id,
      updatedAt: new Date(),
    })
    .where(eq(accessRequests.id, id))
    .returning();

  const email = activationEmail({ name: existing.fullName, code });
  const sent = await sendEmail({ to: existing.email, subject: email.subject, html: email.html, text: email.text });

  return { ok: true, request: accessRequestFromRow(updated), code, emailed: sent.ok };
}

export async function rejectAccessRequest(id: string, adminId: string, note?: string): Promise<ReviewResult> {
  const db = getDb();
  const [updated] = await db
    .update(accessRequests)
    .set({
      status: "rejected",
      reviewNote: note ?? null,
      reviewedByAdminId: adminId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(accessRequests.id, id))
    .returning();
  if (!updated) return { ok: false, error: "Access request not found." };
  return { ok: true, request: accessRequestFromRow(updated) };
}
