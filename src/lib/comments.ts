import { and, asc, count, desc, eq, inArray } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { blogPosts, comments, communityPosts, members } from "@/db/schema";
import type { Comment, CommentTargetType } from "@/lib/types";

// Reacties onder verhalen en groepsberichten.
//
// Opruimen: target_id is polymorf, dus er is geen FK die kan cascaden. De triggers in
// drizzle/0008_comments.sql verwijderen reacties zodra hun blog_post of community_post
// verdwijnt (ook via de cascade bij het verwijderen van een groep). deleteCommentsForTarget
// hieronder is dezelfde opruimactie voor code die ooit buiten de database om verwijdert.

export const COMMENT_MAX_LENGTH = 2000;

export async function listComments(type: CommentTargetType, targetId: string, includeHidden = false): Promise<Comment[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: comments.id,
      target_type: comments.targetType,
      target_id: comments.targetId,
      body: comments.body,
      status: comments.status,
      created_at: comments.createdAt,
      author_id: comments.authorMemberId,
      author_name: members.fullName,
      author_photo: members.photoUrl,
    })
    .from(comments)
    .leftJoin(members, eq(comments.authorMemberId, members.id))
    .where(
      includeHidden
        ? and(eq(comments.targetType, type), eq(comments.targetId, targetId))
        : and(eq(comments.targetType, type), eq(comments.targetId, targetId), eq(comments.status, "published")),
    )
    .orderBy(asc(comments.createdAt));
  return rows.map((row) => ({
    id: row.id,
    target_type: row.target_type as CommentTargetType,
    target_id: row.target_id,
    body: row.body,
    status: row.status as Comment["status"],
    created_at: row.created_at.toISOString(),
    author_id: row.author_id,
    author_name: row.author_name ?? "Verwijderd lid",
    author_photo: row.author_photo,
  }));
}

/** Zichtbare reacties per doel in één gegroepeerde query. Faalt open naar een lege map. */
export async function countComments(type: CommentTargetType, targetIds: string[]): Promise<Record<string, number>> {
  if (!hasDatabase() || !targetIds.length) return {};
  try {
    const db = getDb();
    const rows = await db
      .select({ target_id: comments.targetId, n: count() })
      .from(comments)
      .where(and(eq(comments.targetType, type), inArray(comments.targetId, targetIds), eq(comments.status, "published")))
      .groupBy(comments.targetId);
    return Object.fromEntries(rows.map((row) => [row.target_id, Number(row.n)]));
  } catch {
    return {};
  }
}

export async function countCommentsFor(type: CommentTargetType, targetId: string): Promise<number> {
  return (await countComments(type, [targetId]))[targetId] ?? 0;
}

/** Het doel waarop gereageerd wordt, met wat de API nodig heeft om rechten te bepalen. */
export async function getCommentTarget(
  type: CommentTargetType,
  targetId: string,
): Promise<{ status: string; communityId: string | null } | null> {
  const db = getDb();
  if (type === "blog_post") {
    const [row] = await db.select({ status: blogPosts.status }).from(blogPosts).where(eq(blogPosts.id, targetId)).limit(1);
    return row ? { status: row.status, communityId: null } : null;
  }
  const [row] = await db
    .select({ status: communityPosts.status, communityId: communityPosts.communityId })
    .from(communityPosts)
    .where(eq(communityPosts.id, targetId))
    .limit(1);
  return row ?? null;
}

export async function getComment(id: string) {
  const db = getDb();
  const [row] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return row ?? null;
}

/** Tijdstip van de laatste reactie van dit lid, voor de lichte rate limit. */
export async function lastCommentAt(memberId: string): Promise<Date | null> {
  const db = getDb();
  const [row] = await db
    .select({ created_at: comments.createdAt })
    .from(comments)
    .where(eq(comments.authorMemberId, memberId))
    .orderBy(desc(comments.createdAt))
    .limit(1);
  return row?.created_at ?? null;
}

export async function createComment(type: CommentTargetType, targetId: string, memberId: string, body: string) {
  const db = getDb();
  const [row] = await db
    .insert(comments)
    .values({ targetType: type, targetId, authorMemberId: memberId, body })
    .returning();
  return row;
}

export async function setCommentStatus(id: string, status: "published" | "hidden") {
  const db = getDb();
  await db.update(comments).set({ status, updatedAt: new Date() }).where(eq(comments.id, id));
}

export async function deleteComment(id: string) {
  const db = getDb();
  await db.delete(comments).where(eq(comments.id, id));
}

export async function deleteCommentsForTarget(type: CommentTargetType, targetId: string) {
  const db = getDb();
  await db.delete(comments).where(and(eq(comments.targetType, type), eq(comments.targetId, targetId)));
}
