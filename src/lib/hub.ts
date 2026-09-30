import { cache } from "react";
import { and, count, desc, eq, gte, inArray } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { blogPosts, communities, communityMemberships, communityPosts, eventRsvps, members } from "@/db/schema";
import type { Community } from "@/lib/communities";
import type { CommunityEvent, Member } from "@/lib/types";

// Read models for the community screens (Vandaag, leden, groepen, agenda). Every query fails
// soft: a broken read hides a block instead of breaking the page.

export type PersonSummary = { id: string; full_name: string; photo_url: string | null; role: string | null };

export type FeedPost = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  author_name: string;
  author_photo: string | null;
  community_slug: string;
  community_name: string;
};

// Approved member count per community id.
export const getCommunityCounts = cache(async (): Promise<Record<string, number>> => {
  if (!hasDatabase()) return {};
  try {
    const rows = await getDb()
      .select({ id: communityMemberships.communityId, n: count() })
      .from(communityMemberships)
      .innerJoin(members, eq(communityMemberships.memberId, members.id))
      .where(eq(members.visibilityStatus, "approved"))
      .groupBy(communityMemberships.communityId);
    return Object.fromEntries(rows.map((row) => [row.id, Number(row.n)]));
  } catch {
    return {};
  }
});

// Ids of the communities a member joined.
export const getJoinedCommunityIds = cache(async (memberId: string): Promise<string[]> => {
  if (!hasDatabase()) return [];
  try {
    const rows = await getDb()
      .select({ id: communityMemberships.communityId })
      .from(communityMemberships)
      .where(eq(communityMemberships.memberId, memberId));
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
});

// A few faces per community for the avatar stack on the group header.
export async function getCommunityFaces(communityIds: string[], perCommunity = 5): Promise<Record<string, PersonSummary[]>> {
  if (!hasDatabase() || communityIds.length === 0) return {};
  try {
    const rows = await getDb()
      .select({
        community_id: communityMemberships.communityId,
        id: members.id,
        full_name: members.fullName,
        photo_url: members.photoUrl,
        role: members.role,
      })
      .from(communityMemberships)
      .innerJoin(members, eq(communityMemberships.memberId, members.id))
      .where(and(inArray(communityMemberships.communityId, communityIds), eq(members.visibilityStatus, "approved")))
      .orderBy(desc(communityMemberships.joinedAt));
    const out: Record<string, PersonSummary[]> = {};
    for (const { community_id, ...person } of rows) {
      const list = (out[community_id] ??= []);
      if (list.length < perCommunity) list.push(person);
    }
    return out;
  } catch {
    return {};
  }
}

// Latest published posts in the member's groups from the last `days` days.
export async function getRecentGroupPosts(memberId: string, days = 30, limit = 3): Promise<FeedPost[]> {
  if (!hasDatabase()) return [];
  try {
    const joined = await getJoinedCommunityIds(memberId);
    if (joined.length === 0) return [];
    const since = new Date(Date.now() - days * 86_400_000);
    const rows = await getDb()
      .select({
        id: communityPosts.id,
        body: communityPosts.body,
        created_at: communityPosts.createdAt,
        author_id: communityPosts.authorMemberId,
        author_name: members.fullName,
        author_photo: members.photoUrl,
        community_slug: communities.slug,
        community_name: communities.name,
      })
      .from(communityPosts)
      .innerJoin(communities, eq(communityPosts.communityId, communities.id))
      .leftJoin(members, eq(communityPosts.authorMemberId, members.id))
      .where(
        and(
          inArray(communityPosts.communityId, joined),
          eq(communityPosts.status, "published"),
          gte(communityPosts.createdAt, since),
        ),
      )
      .orderBy(desc(communityPosts.createdAt))
      .limit(limit);
    return rows.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
      author_name: row.author_name ?? "Verwijderd lid",
    }));
  } catch {
    return [];
  }
}

// Approved members who said "going" to an event, newest answer first.
export async function getEventAttendees(eventId: string): Promise<PersonSummary[]> {
  if (!hasDatabase()) return [];
  try {
    return await getDb()
      .select({ id: members.id, full_name: members.fullName, photo_url: members.photoUrl, role: members.role })
      .from(eventRsvps)
      .innerJoin(members, eq(eventRsvps.memberId, members.id))
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.status, "going"), eq(members.visibilityStatus, "approved")))
      .orderBy(desc(eventRsvps.createdAt));
  } catch {
    return [];
  }
}

// Event ids a member said "going" to.
export async function getGoingEventIds(memberId: string): Promise<string[]> {
  if (!hasDatabase()) return [];
  try {
    const rows = await getDb()
      .select({ id: eventRsvps.eventId })
      .from(eventRsvps)
      .where(and(eq(eventRsvps.memberId, memberId), eq(eventRsvps.status, "going")));
    return rows.map((row) => row.id);
  } catch {
    return [];
  }
}

// Number of published stories by a member.
export async function getStoryCount(memberId: string): Promise<number> {
  if (!hasDatabase()) return 0;
  try {
    const [row] = await getDb()
      .select({ n: count() })
      .from(blogPosts)
      .where(and(eq(blogPosts.authorMemberId, memberId), eq(blogPosts.status, "published")));
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

// Has the member answered "going" for any event (upcoming or past)? Used by the welcome steps.
export async function hasAnyRsvp(memberId: string): Promise<boolean> {
  return (await getGoingEventIds(memberId)).length > 0;
}

// ── pure helpers (safe for server and client) ─────────────────────

// Profile counts as complete when the fields other members look at are filled in.
export function isProfileComplete(member: Pick<Member, "role" | "headline" | "about" | "skills">) {
  return Boolean((member.role || member.headline) && member.about?.trim() && member.skills.length > 0);
}

export function coverSrc(community: Pick<Community, "cover_image_url">) {
  return community.cover_image_url || null;
}

export function upcomingEvents(list: CommunityEvent[]) {
  const now = Date.now();
  return list.filter((event) => new Date(event.ends_at ?? event.starts_at).getTime() >= now);
}
