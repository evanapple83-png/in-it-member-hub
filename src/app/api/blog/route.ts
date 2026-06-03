import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { createBlogPost } from "@/lib/blog";

// Phase 6: geautoriseerde leden schrijven blogposts over hun ervaringen.
const postSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(10).max(20000),
  cover_image_url: z.string().url().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen schrijven." }, { status: 403 });

  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Controleer titel en inhoud en probeer opnieuw." }, { status: 400 });

  const created = await createBlogPost(member.id, {
    title: parsed.data.title,
    body: parsed.data.body,
    coverImageUrl: parsed.data.cover_image_url || null,
  });
  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}
