import { randomBytes, createHash } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { invites } from "@/db/schema";

export function generateInviteCode() {
  return `INIT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function hashInviteCode(code: string) {
  return createHash("sha256").update(normalizeInviteCode(code)).digest("hex");
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

export async function getActiveInviteByCode(code: string) {
  const db = getDb();
  const [invite] = await db
    .select()
    .from(invites)
    .where(
      and(
        eq(invites.codeHash, hashInviteCode(code)),
        eq(invites.status, "active"),
        gt(invites.expiresAt, new Date()),
        isNull(invites.usedAt),
      ),
    )
    .limit(1);

  return invite ?? null;
}

export async function redeemInviteCode(code: string, userId: string) {
  const db = getDb();
  const activeInvite = await getActiveInviteByCode(code);
  if (!activeInvite) return null;

  const [invite] = await db
    .update(invites)
    .set({
      status: "used",
      usedAt: new Date(),
      usedByUserId: userId,
      updatedAt: new Date(),
    })
    .where(eq(invites.id, activeInvite.id))
    .returning();

  return invite ?? null;
}
