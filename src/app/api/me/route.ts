import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts, members } from "@/db/schema";
import { getCurrentMember } from "@/lib/access";
import { authOptions } from "@/lib/auth";
import { deleteProfilePhotos } from "@/lib/profile-photos";
import { readJson } from "@/lib/validation";
import { deleteMemberCv } from "@/lib/member-cvs";

// Own profile read — used by the profile form to hydrate existing values
// so a re-save never silently wipes previously stored fields.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });
  const member = await getCurrentMember();
  return NextResponse.json({ member });
}

// AVG §9.1 zelfbeheer: kleine wijzigingen aan het eigen account die NIET door de
// onboarding/review-workflow hoeven (die zet visibility terug naar pending).
const patchSchema = z.object({
  email_opt_out: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const parsed = patchSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });

  const db = getDb();
  const [member] = await db.select({ id: members.id }).from(members).where(eq(members.userId, session.user.id)).limit(1);
  if (!member) return NextResponse.json({ error: "Geen profiel gevonden." }, { status: 404 });

  if (parsed.data.email_opt_out !== undefined) {
    await db
      .update(members)
      .set({ emailOptOut: parsed.data.email_opt_out, updatedAt: new Date() })
      .where(eq(members.id, member.id));
  }
  return NextResponse.json({ ok: true });
}

// AVG §9.1 vergetelheid: verwijdert het profiel en de LinkedIn-koppeling definitief.
// FK-gedrag ruimt de rest op: memberships/RSVP's cascaden mee, geschreven posts blijven
// staan als "Verwijderd lid" (author set null), voordrachten verliezen de verwijzing.
export async function DELETE() {
  if (!hasDatabase()) return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Log eerst in." }, { status: 401 });

  const member = await getCurrentMember();
  try {
    if (member) await deleteMemberCv(member.id);
  } catch (error) {
    console.error("[me:delete] cv cleanup failed", error);
    return NextResponse.json({ error: "Je cv verwijderen lukte niet. Probeer het opnieuw." }, { status: 503 });
  }

  const db = getDb();
  await db.delete(linkedinAccounts).where(eq(linkedinAccounts.userId, session.user.id));
  await db.delete(members).where(eq(members.userId, session.user.id));
  // The account is already gone; a storage hiccup must not report the deletion as failed.
  await deleteProfilePhotos(session.user.id).catch((error) => console.error("[me:delete] photo cleanup failed", error));
  return NextResponse.json({ ok: true });
}
