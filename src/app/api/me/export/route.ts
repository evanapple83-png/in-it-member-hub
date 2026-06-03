import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { getDb, hasDatabase } from "@/db";
import { memberFromRow } from "@/db/mapper";
import { blogPosts, communityMemberships, communityPosts, eventRsvps, linkedinAccounts, members } from "@/db/schema";
import { authOptions } from "@/lib/auth";

// AVG §9.1 inzage: alle gegevens die we van het lid bewaren als downloadbare JSON.
export async function GET() {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const db = getDb();
  const [memberRow] = await db.select().from(members).where(eq(members.userId, session.user.id)).limit(1);
  if (!memberRow) return NextResponse.json({ error: "Geen profiel gevonden." }, { status: 404 });

  const [linkedin, memberships, rsvps, blog, posts] = await Promise.all([
    db.select().from(linkedinAccounts).where(eq(linkedinAccounts.userId, session.user.id)),
    db.select().from(communityMemberships).where(eq(communityMemberships.memberId, memberRow.id)),
    db.select().from(eventRsvps).where(eq(eventRsvps.memberId, memberRow.id)),
    db.select().from(blogPosts).where(eq(blogPosts.authorMemberId, memberRow.id)),
    db.select().from(communityPosts).where(eq(communityPosts.authorMemberId, memberRow.id)),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: memberFromRow(memberRow),
    linkedin_accounts: linkedin.map((account) => ({
      linkedin_sub: account.linkedinSub,
      linkedin_email: account.linkedinEmail,
      linkedin_name: account.linkedinName,
      linkedin_picture: account.linkedinPicture,
      connected_at: account.connectedAt.toISOString(),
      last_synced_at: account.lastSyncedAt.toISOString(),
    })),
    community_memberships: memberships.map((membership) => ({
      community_id: membership.communityId,
      role: membership.role,
      joined_at: membership.joinedAt.toISOString(),
    })),
    event_rsvps: rsvps.map((rsvp) => ({
      event_id: rsvp.eventId,
      status: rsvp.status,
      created_at: rsvp.createdAt.toISOString(),
    })),
    blog_posts: blog.map((post) => ({
      slug: post.slug,
      title: post.title,
      body: post.body,
      status: post.status,
      created_at: post.createdAt.toISOString(),
    })),
    community_posts: posts.map((post) => ({
      community_id: post.communityId,
      body: post.body,
      status: post.status,
      created_at: post.createdAt.toISOString(),
    })),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="in-it-gegevensexport.json"',
    },
  });
}
