import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/db";
import { getApprovedCurrentMember } from "@/lib/access";
import { setRsvp } from "@/lib/events";

const rsvpSchema = z.object({ status: z.enum(["going", "maybe", "declined"]) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });

  const member = await getApprovedCurrentMember();
  if (!member) return NextResponse.json({ error: "Alleen geautoriseerde leden kunnen zich aanmelden." }, { status: 403 });

  const parsed = rsvpSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige RSVP." }, { status: 400 });

  const { id } = await params;
  await setRsvp(id, member.id, parsed.data.status);
  return NextResponse.json({ ok: true, status: parsed.data.status });
}
