import { NextResponse } from "next/server";
import { hasDatabase } from "@/db";
import { isApprovedMember } from "@/lib/access";
import { getEventById } from "@/lib/events";

// .ics download so members can add an activity to their own calendar (Google/Apple/Outlook).
function toIcsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  if (!(await isApprovedMember())) return NextResponse.json({ error: "Unauthorized." }, { status: 403 });

  const { id } = await params;
  const event = await getEventById(id);
  if (!event || event.status !== "published") return NextResponse.json({ error: "Not found." }, { status: 404 });

  const end = event.ends_at ?? new Date(new Date(event.starts_at).getTime() + 60 * 60 * 1000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IN-IT Community//Agenda//NL",
    "BEGIN:VEVENT",
    `UID:${event.id}@in-it.community`,
    `DTSTART:${toIcsDate(event.starts_at)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.location ? `LOCATION:${escapeIcs(event.location)}` : "",
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}${event.meet_link ? escapeIcs(`\n\n${event.meet_link}`) : ""}` : "",
    event.meet_link ? `URL:${event.meet_link}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return new NextResponse(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
