import { and, asc, count, desc, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { communities, communityMemberships, communityPosts, members } from "@/db/schema";
import { uniqueSlug } from "@/lib/slug";
import { slugify } from "@/lib/utils";
import type { CommunityMemberSummary, CommunityPost } from "@/lib/types";

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  is_private: boolean;
  /** Uploaded cover image; null means use `cropFor(slug)`. */
  cover_image_url?: string | null;
};

const seedCommunities: Community[] = [
  {
    id: "security-specialists",
    slug: "security-specialists",
    name: "Security specialists",
    description: "Cybersecurity, risk, compliance and secure engineering across the community.",
    category: "professional",
    is_private: true,
  },
  {
    id: "engineers",
    slug: "engineers",
    name: "Engineers",
    description: "Software, data, cloud and platform builders sharing practical expertise.",
    category: "professional",
    is_private: true,
  },
  {
    id: "product-design",
    slug: "product-design",
    name: "Product & design",
    description: "Product managers, UX designers and makers shaping better digital products.",
    category: "professional",
    is_private: true,
  },
  {
    id: "football",
    slug: "football",
    name: "Football",
    description: "A lighter social space for members who connect around football.",
    category: "social",
    is_private: true,
  },
];

export async function getCommunities(): Promise<Community[]> {
  if (!hasDatabase()) return seedCommunities;

  try {
    const db = getDb();
    const rows = await db.select().from(communities).orderBy(asc(communities.category), asc(communities.name));
    return rows.map((community) => ({
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      category: community.category,
      is_private: community.isPrivate,
      cover_image_url: community.coverImageUrl ?? null,
    }));
  } catch {
    return seedCommunities;
  }
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  return (await getCommunities()).find((community) => community.slug === slug) ?? null;
}

export async function getCommunityMembers(communityId: string): Promise<CommunityMemberSummary[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: members.id,
        full_name: members.fullName,
        headline: members.headline,
        role: members.role,
        photo_url: members.photoUrl,
        community_role: communityMemberships.role,
      })
      .from(communityMemberships)
      .innerJoin(members, eq(communityMemberships.memberId, members.id))
      .where(and(eq(communityMemberships.communityId, communityId), eq(members.visibilityStatus, "approved")))
      .orderBy(asc(members.fullName));
    return rows;
  } catch {
    return [];
  }
}

export async function getMembership(communityId: string, memberId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.memberId, memberId)))
    .limit(1);
  return row ?? null;
}

export async function joinCommunity(communityId: string, memberId: string) {
  const db = getDb();
  await db
    .insert(communityMemberships)
    .values({ communityId, memberId })
    .onConflictDoNothing({ target: [communityMemberships.communityId, communityMemberships.memberId] });
}

export async function leaveCommunity(communityId: string, memberId: string) {
  const db = getDb();
  await db
    .delete(communityMemberships)
    .where(and(eq(communityMemberships.communityId, communityId), eq(communityMemberships.memberId, memberId)));
}

export async function listCommunityPosts(communityId: string, includeHidden = false): Promise<CommunityPost[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: communityPosts.id,
        community_id: communityPosts.communityId,
        body: communityPosts.body,
        status: communityPosts.status,
        created_at: communityPosts.createdAt,
        author_id: communityPosts.authorMemberId,
        author_name: members.fullName,
        author_photo: members.photoUrl,
        author_role: members.role,
      })
      .from(communityPosts)
      .leftJoin(members, eq(communityPosts.authorMemberId, members.id))
      .where(
        includeHidden
          ? eq(communityPosts.communityId, communityId)
          : and(eq(communityPosts.communityId, communityId), eq(communityPosts.status, "published")),
      )
      .orderBy(desc(communityPosts.createdAt));
    return rows
      .map((row) => ({
        id: row.id,
        community_id: row.community_id,
        body: row.body,
        status: row.status as CommunityPost["status"],
        created_at: row.created_at.toISOString(),
        author_id: row.author_id,
        author_name: row.author_name ?? "Verwijderd lid",
        author_photo: row.author_photo,
        author_role: row.author_role,
      }));
  } catch {
    return [];
  }
}

export async function createCommunityPost(communityId: string, memberId: string, body: string) {
  const db = getDb();
  const [row] = await db.insert(communityPosts).values({ communityId, authorMemberId: memberId, body }).returning();
  return row;
}

export async function getCommunityPost(postId: string) {
  const db = getDb();
  const [row] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1);
  return row ?? null;
}

export async function setCommunityPostStatus(postId: string, status: "published" | "hidden") {
  const db = getDb();
  await db.update(communityPosts).set({ status, updatedAt: new Date() }).where(eq(communityPosts.id, postId));
}

export async function deleteCommunityPost(postId: string) {
  const db = getDb();
  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
}

// --- Admin beheer (niet in FRD: communities aanmaken/beheren, extra-wens Evan) ---

export type CommunityAdminView = Community & { member_count: number };

export async function listCommunitiesForAdmin(): Promise<CommunityAdminView[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: communities.id,
      slug: communities.slug,
      name: communities.name,
      description: communities.description,
      category: communities.category,
      is_private: communities.isPrivate,
      cover_image_url: communities.coverImageUrl,
      member_count: count(communityMemberships.id),
    })
    .from(communities)
    .leftJoin(communityMemberships, eq(communityMemberships.communityId, communities.id))
    .groupBy(communities.id)
    .orderBy(asc(communities.category), asc(communities.name));
  return rows;
}

export async function createCommunity(input: {
  name: string;
  description?: string | null;
  category?: string;
  coverImageUrl?: string | null;
}) {
  const db = getDb();
  // Prefer a clean, readable slug (the slug is the community URL); fall back to a
  // random-suffixed one only when the name is already taken.
  const base = slugify(input.name).slice(0, 60);
  const [taken] = base
    ? await db.select({ id: communities.id }).from(communities).where(eq(communities.slug, base)).limit(1)
    : [undefined];
  const slug = base && !taken ? base : uniqueSlug(input.name, "community");
  const [row] = await db
    .insert(communities)
    .values({
      slug,
      name: input.name,
      description: input.description ?? null,
      category: input.category ?? "professional",
      coverImageUrl: input.coverImageUrl ?? null,
    })
    .returning();
  return row;
}

export async function updateCommunity(
  id: string,
  patch: { name?: string; description?: string | null; category?: string; coverImageUrl?: string | null },
) {
  const db = getDb();
  const [row] = await db
    .update(communities)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(communities.id, id))
    .returning();
  return row ?? null;
}

// Verwijdert ook alle lidmaatschappen en posts in de community (on delete cascade).
export async function deleteCommunity(id: string) {
  const db = getDb();
  await db.delete(communities).where(eq(communities.id, id));
}
