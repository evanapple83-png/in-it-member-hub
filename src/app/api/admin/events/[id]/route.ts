import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteEvent, publishEvent, unpublishEvent, updateEvent } from "@/lib/events";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";

const patchSchema = z.object({
  action: z.enum(["update", "publish", "unpublish"]).default("update"),
  notify: z.boolean().optional(),
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(4000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  starts_at: z.string().datetime({ offset: true }).optional(),
  ends_at: z.string().datetime({ offset: true }).nullable().optional(),
  category: z.string().max(50).optional(),
  // Mirror the POST schema: links must be real URLs ("" / null clears the field).
  meet_link: z.string().url().max(500).nullable().optional().or(z.literal("")),
  calendar_link: z.string().url().max(500).nullable().optional().or(z.literal("")),
  cover_image_url: z.string().url().max(500).nullable().optional().or(z.literal("")),
  audience: z.string().max(50).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_activities")) {
    return NextResponse.json({ error: "Alleen de coordinator mag activiteiten beheren." }, { status: 403 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige activiteit-update." }, { status: 400 });
  const data = parsed.data;

  if (data.action === "publish") {
    const result = await publishEvent(id, data.notify ?? false);
    if (!result) return NextResponse.json({ error: "Activiteit niet gevonden." }, { status: 404 });
    return NextResponse.json({ event: result.event, notified: result.notified });
  }

  if (data.action === "unpublish") {
    const event = await unpublishEvent(id);
    if (!event) return NextResponse.json({ error: "Activiteit niet gevonden." }, { status: 404 });
    return NextResponse.json({ event });
  }

  const event = await updateEvent(id, {
    ...(data.title !== undefined ? { title: data.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.location !== undefined ? { location: data.location } : {}),
    ...(data.starts_at !== undefined ? { startsAt: new Date(data.starts_at) } : {}),
    ...(data.ends_at !== undefined ? { endsAt: data.ends_at ? new Date(data.ends_at) : null } : {}),
    ...(data.category !== undefined ? { category: data.category } : {}),
    ...(data.meet_link !== undefined ? { meetLink: data.meet_link || null } : {}),
    ...(data.calendar_link !== undefined ? { calendarLink: data.calendar_link || null } : {}),
    ...(data.cover_image_url !== undefined ? { coverImageUrl: data.cover_image_url || null } : {}),
    ...(data.audience !== undefined ? { audience: data.audience } : {}),
  });
  if (!event) return NextResponse.json({ error: "Activiteit niet gevonden." }, { status: 404 });
  return NextResponse.json({ event });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_activities")) {
    return NextResponse.json({ error: "Alleen de coordinator mag activiteiten beheren." }, { status: 403 });
  }
  const { id } = await params;
  await deleteEvent(id);
  return NextResponse.json({ ok: true });
}
