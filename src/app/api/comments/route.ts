import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { COMMENT_MAX_LENGTH, createComment, getCommentTarget, lastCommentAt, listComments } from "@/lib/comments";
import { getMembership } from "@/lib/communities";
import { adminCan } from "@/lib/roles";
import type { Comment } from "@/lib/types";
import { readJson } from "@/lib/validation";
import { tooManyRequests, underLimit } from "@/lib/rate-limit";

const UNAVAILABLE = "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw.";
const RATE_LIMIT_MS = 5_000;

const targetSchema = z.object({
  type: z.enum(["blog_post", "community_post"]),
  id: z.string().uuid(),
});

const postSchema = targetSchema.extend({
  body: z.string().trim().min(1).max(COMMENT_MAX_LENGTH),
});

async function viewer() {
  const [member, role] = await Promise.all([getApprovedCurrentMember(), getCurrentAdminRole()]);
  return { member, isModerator: role !== null && adminCan(role, "moderate") };
}

// GET /api/comments?type=blog_post|community_post&id=<uuid>
// Leden zien gepubliceerde reacties; moderatoren zien ook verborgen reacties.
export async function GET(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ comments: [] });
  const { member, isModerator } = await viewer();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden." }, { status: 403 });

  const url = new URL(request.url);
  const parsed = targetSchema.safeParse({ type: url.searchParams.get("type"), id: url.searchParams.get("id") });
  if (!parsed.success) return NextResponse.json({ error: "Onbekend bericht." }, { status: 400 });

  const target = await getCommentTarget(parsed.data.type, parsed.data.id);
  if (!target || (target.status !== "published" && !isModerator)) {
    return NextResponse.json({ error: "Bericht niet gevonden." }, { status: 404 });
  }

  const list = await listComments(parsed.data.type, parsed.data.id, isModerator);
  return NextResponse.json({ comments: list });
}

// POST /api/comments { type, id, body }
export async function POST(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
  const { member, isModerator } = await viewer();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen reageren." }, { status: 403 });
  if (!(await underLimit(`comment:${member.id}`, 20, 600))) return tooManyRequests();

  const parsed = postSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((issue) => issue.code === "too_big");
    return NextResponse.json(
      { error: tooLong ? `Een reactie mag maximaal ${COMMENT_MAX_LENGTH} tekens zijn.` : "Je reactie is nog leeg." },
      { status: 400 },
    );
  }
  const { type, id, body } = parsed.data;

  const target = await getCommentTarget(type, id);
  if (!target || (target.status !== "published" && !isModerator)) {
    return NextResponse.json({ error: "Dit bericht bestaat niet meer." }, { status: 404 });
  }

  // Zelfde regel als plaatsen in een groep: alleen leden van die groep praten mee.
  if (type === "community_post" && target.communityId && !isModerator) {
    const membership = await getMembership(target.communityId, member.id);
    if (!membership) return NextResponse.json({ error: "Word lid van deze groep om te reageren." }, { status: 403 });
  }

  const last = await lastCommentAt(member.id);
  if (last && Date.now() - last.getTime() < RATE_LIMIT_MS) {
    return NextResponse.json({ error: "Rustig aan, je reageerde net al. Probeer het zo opnieuw." }, { status: 429 });
  }

  const row = await createComment(type, id, member.id, body);
  const comment: Comment = {
    id: row.id,
    target_type: type,
    target_id: id,
    body: row.body,
    status: row.status as Comment["status"],
    created_at: row.createdAt.toISOString(),
    author_id: member.id,
    author_name: member.full_name,
    author_photo: member.photo_url ?? null,
  };
  return NextResponse.json({ ok: true, comment });
}
