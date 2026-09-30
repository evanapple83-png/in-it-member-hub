import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { deleteBlogPost, getBlogPostById, setBlogPostShowcase, setBlogPostStatus, updateBlogPost } from "@/lib/blog";
import { adminCan } from "@/lib/roles";
import { httpsUrl, optionalUrl, readJson } from "@/lib/validation";

const patchSchema = z.object({
  title: z.string().min(3).max(140).optional(),
  body: z.string().min(10).max(20000).optional(),
  cover_image_url: optionalUrl(httpsUrl),
  // Moderation (beheerder-only)
  status: z.enum(["published", "hidden"]).optional(),
  showcase: z.boolean().optional(),
});

// Author edits their own post; beheerder moderates (hide/show) and picks the Showcase van de week.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });

  const { id } = await params;
  const [member, role, post] = await Promise.all([getApprovedCurrentMember(), getCurrentAdminRole(), getBlogPostById(id)]);
  if (!post) return NextResponse.json({ error: "Verhaal niet gevonden." }, { status: 404 });

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Controleer de velden en probeer opnieuw." }, { status: 400 });
  const data = parsed.data;

  const isAuthor = Boolean(member && post.author_id === member.id);
  const isModerator = role !== null && adminCan(role, "moderate");

  const wantsModeration = data.status !== undefined || data.showcase !== undefined;
  if (wantsModeration && !isModerator) {
    return NextResponse.json({ error: "Alleen een beheerder mag modereren." }, { status: 403 });
  }

  const wantsContentEdit = data.title !== undefined || data.body !== undefined || data.cover_image_url !== undefined;
  if (wantsContentEdit && !isAuthor && !isModerator) {
    return NextResponse.json({ error: "Je kunt alleen je eigen verhaal bewerken." }, { status: 403 });
  }

  if (wantsContentEdit) {
    await updateBlogPost(id, {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.cover_image_url !== undefined ? { coverImageUrl: data.cover_image_url || null } : {}),
    });
  }
  if (data.status !== undefined) await setBlogPostStatus(id, data.status);
  if (data.showcase !== undefined) await setBlogPostShowcase(id, data.showcase);

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });

  const { id } = await params;
  const [member, role, post] = await Promise.all([getApprovedCurrentMember(), getCurrentAdminRole(), getBlogPostById(id)]);
  if (!post) return NextResponse.json({ error: "Verhaal niet gevonden." }, { status: 404 });

  const isAuthor = Boolean(member && post.author_id === member.id);
  const isModerator = role !== null && adminCan(role, "moderate");
  if (!isAuthor && !isModerator) {
    return NextResponse.json({ error: "Geen rechten om dit verhaal te verwijderen." }, { status: 403 });
  }

  await deleteBlogPost(id);
  return NextResponse.json({ ok: true });
}
