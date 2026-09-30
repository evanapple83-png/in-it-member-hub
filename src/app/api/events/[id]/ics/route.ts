import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { isApprovedMember } from "@/lib/access";
import { getEventById } from "@/lib/events";

// .ics download so members can add an activity to their own calendar (Google/Apple/Outlook).
function toIcsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Newlines become the literal \n escape; any leftover raw CR/LF is dropped so a value can never
// start a new property line (e.g. an injected ATTENDEE or a second VEVENT).
function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n/g, "\\n")
    .replace(/[\r\n]/g, "");
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  if (!(await isApprovedMember())) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen dit downloaden." }, { status: 403 });

  const { id } = await params;
  const event = z.guid().safeParse(id).success ? await getEventById(id) : null;
  if (!event || event.status !== "published") return NextResponse.json({ error: "Activiteit niet gevonden." }, { status: 404 });

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
    event.meet_link ? `URL:${escapeIcs(event.meet_link)}` : "",
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
