import { NextResponse } from "next/server";
import { z } from "zod";
import { createCommunity, listCommunitiesForAdmin } from "@/lib/communities";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";

export async function GET() {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_communities")) {
    return NextResponse.json({ error: "Alleen de beheerder mag communities beheren." }, { status: 403 });
  }
  const communities = await listCommunitiesForAdmin();
  return NextResponse.json({ communities });
}

const communitySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional().or(z.literal("")),
  category: z.enum(["professional", "social"]).optional(),
  cover_image_url: z.string().url().max(500).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_communities")) {
    return NextResponse.json({ error: "Alleen de beheerder mag communities beheren." }, { status: 403 });
  }

  const parsed = communitySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Controleer de communitygegevens." }, { status: 400 });

  const data = parsed.data;
  const community = await createCommunity({
    name: data.name,
    description: data.description || null,
    category: data.category ?? "professional",
    coverImageUrl: data.cover_image_url || null,
  });

  return NextResponse.json({ community });
}
