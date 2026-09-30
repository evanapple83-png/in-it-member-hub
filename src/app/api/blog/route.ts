import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { createBlogPost } from "@/lib/blog";
import { httpsUrl, optionalUrl, readJson } from "@/lib/validation";
import { tooManyRequests, underLimit } from "@/lib/rate-limit";

// Phase 6: geautoriseerde leden schrijven blogposts over hun ervaringen.
const postSchema = z.object({
  title: z.string().min(3).max(140),
  body: z.string().min(10).max(20000),
  cover_image_url: optionalUrl(httpsUrl),
});

export async function POST(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen schrijven." }, { status: 403 });
  if (!(await underLimit(`blog:${member.id}`, 10, 3600))) return tooManyRequests();

  const parsed = postSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Controleer titel en inhoud en probeer opnieuw." }, { status: 400 });

  const created = await createBlogPost(member.id, {
    title: parsed.data.title,
    body: parsed.data.body,
    coverImageUrl: parsed.data.cover_image_url || null,
  });
  return NextResponse.json({ ok: true, id: created.id, slug: created.slug });
}
