import { cache } from "react";
import { and, asc, count, eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { accessRequests, communities, communityMemberships, members } from "@/db/schema";
import { listBlogPosts } from "@/lib/blog";
import { getCommunities } from "@/lib/communities";
import { listPublishedEvents } from "@/lib/events";
import { getPublicMembers } from "@/lib/members";

// Data the app and admin shells need on every page. Small on purpose.

export type ShellGroup = { slug: string; name: string };

export type SearchIndex = {
  members: { id: string; name: string; role: string | null; photoUrl: string | null }[];
  groups: { slug: string; name: string; category: string }[];
  events: { slug: string; title: string; startsAt: string; location: string | null }[];
  stories: { slug: string; title: string; author: string }[];
};

// Communities the member joined, for "Mijn groepen" in the sidebar.
export const getMyGroups = cache(async (memberId: string): Promise<ShellGroup[]> => {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    return await db
      .select({ slug: communities.slug, name: communities.name })
      .from(communityMemberships)
      .innerJoin(communities, eq(communityMemberships.communityId, communities.id))
      .where(eq(communityMemberships.memberId, memberId))
      .orderBy(asc(communities.name));
  } catch {
    return [];
  }
});

// Upcoming published events the member has not answered yet (agenda badge).
export const getOpenAgendaCount = cache(async (memberId: string): Promise<number> => {
  const now = Date.now();
  const list = await listPublishedEvents(memberId);
  return list.filter((event) => new Date(event.starts_at).getTime() >= now && !event.my_rsvp).length;
});

// Everything the ⌘K palette can find. Built on the server, filtered on the client.
export const getSearchIndex = cache(async (memberId: string): Promise<SearchIndex> => {
  const now = Date.now();
  const [people, groups, events, posts] = await Promise.all([
    getPublicMembers(),
    getCommunities(),
    listPublishedEvents(memberId),
    listBlogPosts(),
  ]);
  return {
    members: people.slice(0, 300).map((m) => ({ id: m.id, name: m.full_name, role: m.role ?? null, photoUrl: m.photo_url ?? null })),
    groups: groups.map((g) => ({ slug: g.slug, name: g.name, category: g.category })),
    events: events
      .filter((e) => new Date(e.starts_at).getTime() >= now)
      .slice(0, 20)
      .map((e) => ({ slug: e.slug, title: e.title, startsAt: e.starts_at, location: e.location ?? null })),
    stories: posts.slice(0, 30).map((p) => ({ slug: p.slug, title: p.title, author: p.author_name })),
  };
});

// Pending member applications + open access requests (Aanvragen badge in beheer).
export const getAdminOpenCount = cache(async (): Promise<number> => {
  if (!hasDatabase()) return 0;
  try {
    const db = getDb();
    const [[pending], [requests]] = await Promise.all([
      db
        .select({ n: count() })
        .from(members)
        // Same population as the Aanvragen list: pending accounts that finished consent + onboarding.
        .where(and(eq(members.visibilityStatus, "pending"), eq(members.consentGiven, true), eq(members.onboardingCompleted, true))),
      db.select({ n: count() }).from(accessRequests).where(eq(accessRequests.status, "requested")),
    ]);
    return Number(pending?.n ?? 0) + Number(requests?.n ?? 0);
  } catch {
    return 0;
  }
});
