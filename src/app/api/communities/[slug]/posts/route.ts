import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { createCommunityPost, getCommunityBySlug, listCommunityPosts } from "@/lib/communities";
import { adminCan } from "@/lib/roles";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ posts: [] });
  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden." }, { status: 403 });

  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return NextResponse.json({ error: "Community niet gevonden." }, { status: 404 });

  const role = await getCurrentAdminRole();
  const isModerator = role !== null && adminCan(role, "moderate");
  const posts = await listCommunityPosts(community.id, isModerator);
  return NextResponse.json({ posts });
}

const postSchema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen plaatsen." }, { status: 403 });

  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) return NextResponse.json({ error: "Community niet gevonden." }, { status: 404 });

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bericht mag niet leeg zijn." }, { status: 400 });

  await createCommunityPost(community.id, member.id, parsed.data.body);
  return NextResponse.json({ ok: true });
}
