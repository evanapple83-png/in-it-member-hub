import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { deleteComment, getComment, setCommentStatus } from "@/lib/comments";
import { adminCan } from "@/lib/roles";

const UNAVAILABLE = "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";

// PATCH { status }: alleen een beheerder verbergt of toont een reactie.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  const role = await getCurrentAdminRole();
  if (role === null || !adminCan(role, "moderate")) {
    return NextResponse.json({ error: "Alleen een beheerder mag modereren." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = z.object({ status: z.enum(["published", "hidden"]) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige status." }, { status: 400 });
  if (!(await getComment(id))) return NextResponse.json({ error: "Reactie niet gevonden." }, { status: 404 });

  await setCommentStatus(id, parsed.data.status);
  return NextResponse.json({ ok: true, status: parsed.data.status });
}

// DELETE: de schrijver haalt de eigen reactie weg, een beheerder elke reactie.
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });

  const { id } = await params;
  const [member, role, comment] = await Promise.all([getApprovedCurrentMember(), getCurrentAdminRole(), getComment(id)]);
  if (!comment) return NextResponse.json({ error: "Reactie niet gevonden." }, { status: 404 });

  const isAuthor = Boolean(member && comment.authorMemberId === member.id);
  const isModerator = role !== null && adminCan(role, "moderate");
  if (!isAuthor && !isModerator) {
    return NextResponse.json({ error: "Je kunt alleen je eigen reactie verwijderen." }, { status: 403 });
  }

  await deleteComment(id);
  return NextResponse.json({ ok: true });
}
