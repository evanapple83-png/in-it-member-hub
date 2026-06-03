import { NextResponse } from "next/server";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCommunityBySlug, joinCommunity, leaveCommunity } from "@/lib/communities";

async function resolve(slug: string) {
  if (!hasDatabase()) return { error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw.", status: 503 as const };
  const member = await getApprovedCurrentMember();
  if (!member) return { error: "Alleen geautoriseerde leden kunnen deelnemen.", status: 403 as const };
  const community = await getCommunityBySlug(slug);
  if (!community) return { error: "Community niet gevonden.", status: 404 as const };
  return { member, community };
}

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  await joinCommunity(resolved.community.id, resolved.member.id);
  return NextResponse.json({ ok: true, joined: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolve(slug);
  if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  await leaveCommunity(resolved.community.id, resolved.member.id);
  return NextResponse.json({ ok: true, joined: false });
}
