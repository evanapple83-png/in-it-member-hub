import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { getEventById, setRsvp } from "@/lib/events";
import { readJson } from "@/lib/validation";

const rsvpSchema = z.object({ status: z.enum(["going", "maybe", "declined"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });

  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen zich aanmelden." }, { status: 403 });

  const parsed = rsvpSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige RSVP." }, { status: 400 });

  // Only published activities take RSVPs; a draft or unknown id must not be discoverable here.
  const { id } = await params;
  const event = z.guid().safeParse(id).success ? await getEventById(id) : null;
  if (!event || event.status !== "published") return NextResponse.json({ error: "Activiteit niet gevonden." }, { status: 404 });

  await setRsvp(id, member.id, parsed.data.status);
  return NextResponse.json({ ok: true, status: parsed.data.status });
}
