import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { blogPosts, members } from "@/db/schema";
import { uniqueSlug } from "@/lib/slug";
import type { BlogPost } from "@/lib/types";

export type BlogPostInput = {
  title: string;
  body: string;
  coverImageUrl?: string | null;
};

// Shared select with author join so every read returns display-ready rows.
const selection = {
  id: blogPosts.id,
  slug: blogPosts.slug,
  title: blogPosts.title,
  body: blogPosts.body,
  cover_image_url: blogPosts.coverImageUrl,
  status: blogPosts.status,
  showcased_at: blogPosts.showcasedAt,
  created_at: blogPosts.createdAt,
  updated_at: blogPosts.updatedAt,
  author_id: blogPosts.authorMemberId,
  author_name: members.fullName,
  author_photo: members.photoUrl,
  author_role: members.role,
};

type SelectedRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  cover_image_url: string | null;
  status: string;
  showcased_at: Date | null;
  created_at: Date;
  updated_at: Date;
  author_id: string | null;
  author_name: string | null;
  author_photo: string | null;
  author_role: string | null;
};

function mapRow(row: SelectedRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    cover_image_url: row.cover_image_url,
    status: row.status as BlogPost["status"],
    showcased_at: row.showcased_at?.toISOString() ?? null,
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    author_id: row.author_id,
    author_name: row.author_name ?? "Verwijderd lid",
    author_photo: row.author_photo,
    author_role: row.author_role,
  };
}

export async function listBlogPosts(includeHidden = false): Promise<BlogPost[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select(selection)
      .from(blogPosts)
      .leftJoin(members, eq(blogPosts.authorMemberId, members.id))
      .where(includeHidden ? undefined : eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.createdAt));
    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const [row] = await db
    .select(selection)
    .from(blogPosts)
    .leftJoin(members, eq(blogPosts.authorMemberId, members.id))
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return row ? mapRow(row) : null;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const db = getDb();
  const [row] = await db
    .select(selection)
    .from(blogPosts)
    .leftJoin(members, eq(blogPosts.authorMemberId, members.id))
    .where(eq(blogPosts.id, id))
    .limit(1);
  return row ? mapRow(row) : null;
}

// Showcase van de week: de meest recent door de beheerder gemarkeerde gepubliceerde post.
export async function getShowcasePost(): Promise<BlogPost | null> {
  if (!hasDatabase()) return null;
  try {
    const db = getDb();
    const [row] = await db
      .select(selection)
      .from(blogPosts)
      .leftJoin(members, eq(blogPosts.authorMemberId, members.id))
      .where(and(eq(blogPosts.status, "published"), isNotNull(blogPosts.showcasedAt)))
      .orderBy(desc(blogPosts.showcasedAt))
      .limit(1);
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

export async function createBlogPost(memberId: string, input: BlogPostInput): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const [row] = await db
    .insert(blogPosts)
    .values({
      slug: uniqueSlug(input.title, "verhaal"),
      title: input.title,
      body: input.body,
      coverImageUrl: input.coverImageUrl ?? null,
      authorMemberId: memberId,
    })
    .returning({ id: blogPosts.id, slug: blogPosts.slug });
  return row;
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<void> {
  const db = getDb();
  await db
    .update(blogPosts)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.body !== undefined ? { body: input.body } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      updatedAt: new Date(),
    })
    .where(eq(blogPosts.id, id));
}

export async function setBlogPostStatus(id: string, status: "published" | "hidden"): Promise<void> {
  const db = getDb();
  await db.update(blogPosts).set({ status, updatedAt: new Date() }).where(eq(blogPosts.id, id));
}

export async function setBlogPostShowcase(id: string, showcased: boolean): Promise<void> {
  const db = getDb();
  await db
    .update(blogPosts)
    .set({ showcasedAt: showcased ? new Date() : null, updatedAt: new Date() })
    .where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: string): Promise<void> {
  const db = getDb();
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// Korte preview voor lijstkaarten (RSC-safe, geen markdown-parsing).
export function excerpt(body: string, length = 220): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= length ? flat : `${flat.slice(0, length).trimEnd()}…`;
}
