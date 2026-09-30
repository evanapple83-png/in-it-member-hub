import { NextResponse } from "next/server";
import { z } from "zod";
import { createEvent, listAllEventsForAdmin } from "@/lib/events";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";
import { httpsUrl, optionalUrl, readJson } from "@/lib/validation";

export async function GET() {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_activities")) {
    return NextResponse.json({ error: "Alleen de coordinator mag activiteiten beheren." }, { status: 403 });
  }
  const events = await listAllEventsForAdmin();
  return NextResponse.json({ events });
}

const eventSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional().or(z.literal("")),
  location: z.string().max(200).optional().or(z.literal("")),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  category: z.string().max(50).optional(),
  meet_link: optionalUrl(httpsUrl),
  calendar_link: optionalUrl(httpsUrl),
  cover_image_url: optionalUrl(httpsUrl),
  audience: z.string().max(50).optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  if (!adminCan(admin.role, "manage_activities")) {
    return NextResponse.json({ error: "Alleen de coordinator mag activiteiten beheren." }, { status: 403 });
  }

  const parsed = eventSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Controleer de activiteitsgegevens." }, { status: 400 });

  const data = parsed.data;
  const event = await createEvent(
    {
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      startsAt: new Date(data.starts_at),
      endsAt: data.ends_at ? new Date(data.ends_at) : null,
      category: data.category || "community",
      meetLink: data.meet_link || null,
      calendarLink: data.calendar_link || null,
      coverImageUrl: data.cover_image_url || null,
      audience: data.audience || "all",
    },
    admin.adminId,
  );

  return NextResponse.json({ event });
}
