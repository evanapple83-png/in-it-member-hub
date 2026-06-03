import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { deleteCommunityPost, getCommunityPost, setCommunityPostStatus } from "@/lib/communities";
import { adminCan } from "@/lib/roles";

// Admin (beheerder) moderates any post; an author may remove their own.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  const role = await getCurrentAdminRole();
  if (role === null || !adminCan(role, "moderate")) {
    return NextResponse.json({ error: "Alleen een beheerder mag modereren." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = z.object({ status: z.enum(["published", "hidden"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });

  await setCommunityPostStatus(id, parsed.data.status);
  return NextResponse.json({ ok: true, status: parsed.data.status });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });

  const { id } = await params;
  const [member, role, post] = await Promise.all([getApprovedCurrentMember(), getCurrentAdminRole(), getCommunityPost(id)]);
  if (!post) return NextResponse.json({ error: "Bericht niet gevonden." }, { status: 404 });

  const isAuthor = member && post.authorMemberId === member.id;
  const isModerator = role !== null && adminCan(role, "moderate");
  if (!isModerator && !isAuthor) {
    return NextResponse.json({ error: "Geen rechten om dit bericht te verwijderen." }, { status: 403 });
  }

  await deleteCommunityPost(id);
  return NextResponse.json({ ok: true });
}
