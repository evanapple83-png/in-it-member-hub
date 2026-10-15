import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { memberCvs } from "@/db/schema";
import { deleteStoredCv } from "@/lib/cv-storage";

export async function getMemberCv(memberId: string) {
  const [cv] = await getDb().select().from(memberCvs).where(eq(memberCvs.memberId, memberId)).limit(1);
  return cv ?? null;
}

export function cvDetails(cv: NonNullable<Awaited<ReturnType<typeof getMemberCv>>>) {
  return { filename: cv.filename, size: cv.size, uploadedAt: cv.uploadedAt.toISOString(), downloadUrl: `/api/members/${cv.memberId}/cv` };
}

export async function deleteMemberCv(memberId: string) {
  const cv = await getMemberCv(memberId);
  if (!cv) return;
  // Keep metadata available for retry if storage deletion fails.
  await deleteStoredCv(cv);
  await getDb().delete(memberCvs).where(and(eq(memberCvs.memberId, memberId), eq(memberCvs.storageKey, cv.storageKey)));
}
