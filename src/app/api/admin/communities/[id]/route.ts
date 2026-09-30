import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteCommunity, updateCommunity } from "@/lib/communities";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";

const patchSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).nullable().optional().or(z.literal("")),
  category: z.enum(["professional", "social"]).optional(),
  cover_image_url: z.string().url().max(500).nullable().optional().or(z.literal("")),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_communities")) {
    return NextResponse.json({ error: "Alleen de beheerder mag communities beheren." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige community-update." }, { status: 400 });
  const data = parsed.data;

  const community = await updateCommunity(id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description || null } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.cover_image_url !== undefined ? { coverImageUrl: data.cover_image_url || null } : {}),
  });
  if (!community) return NextResponse.json({ error: "Community niet gevonden." }, { status: 404 });
  return NextResponse.json({ community });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_communities")) {
    return NextResponse.json({ error: "Alleen de beheerder mag communities beheren." }, { status: 403 });
  }
  const { id } = await params;
  await deleteCommunity(id);
  return NextResponse.json({ ok: true });
}
