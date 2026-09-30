import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts, members } from "@/db/schema";
import { memberFromRow } from "@/db/mapper";
import { authOptions } from "@/lib/auth";
import { imageUrl, linkedinUrl, optionalUrl, readJson, shortText, tagList } from "@/lib/validation";

const onboardingSchema = z.object({
  full_name: shortText(120).pipe(z.string().min(2)),
  email: z.string().trim().toLowerCase().max(254).email(),
  linkedin_url: optionalUrl(linkedinUrl),
  photo_url: optionalUrl(imageUrl),
  headline: shortText(160).optional().nullable(),
  role: shortText(160).pipe(z.string().min(2)),
  company: shortText(160).optional().nullable(),
  location: shortText(160).pipe(z.string().min(2)),
  about: shortText(2000).optional().nullable(),
  skills: tagList.default([]),
  can_help_with: tagList.default([]),
  looking_for: tagList.default([]),
  languages: tagList.default([]),
  open_to_mentor: z.boolean().default(false),
  open_to_opportunities: z.boolean().default(false),
  open_to_collaborate: z.boolean().default(false),
  open_to_speaking: z.boolean().default(false),
  // Whitelist: only known PublicFieldKey values may be stored (BP-004)
  public_fields: z
    .array(
      z.enum(["photo_url", "headline", "role", "company", "location", "about", "skills", "can_help_with", "languages", "linkedin_url"]),
    )
    .default([]),
  consent_given: z.literal(true),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "De service is tijdelijk niet beschikbaar. Probeer het later opnieuw." }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Log opnieuw in met LinkedIn om verder te gaan." }, { status: 401 });
  }

  const payload = onboardingSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "Vul alle verplichte velden in en geef toestemming." }, { status: 400 });
  }

  const userId = session.user.id;
  const db = getDb();

  // Only a real hub account (created by the signIn callback via invite or bootstrap) may onboard.
  const [account] = await db
    .select({ id: linkedinAccounts.id })
    .from(linkedinAccounts)
    .where(eq(linkedinAccounts.linkedinSub, userId))
    .limit(1);
  if (!account) {
    return NextResponse.json({ error: "Log opnieuw in met LinkedIn om verder te gaan." }, { status: 403 });
  }

  const email = payload.data.email;
  const profile = {
    fullName: payload.data.full_name,
    email,
    linkedinUrl: payload.data.linkedin_url || null,
    photoUrl: payload.data.photo_url || null,
    headline: payload.data.headline || null,
    role: payload.data.role,
    company: payload.data.company || null,
    location: payload.data.location,
    about: payload.data.about || null,
    skills: payload.data.skills,
    canHelpWith: payload.data.can_help_with,
    lookingFor: payload.data.looking_for,
    languages: payload.data.languages,
    openToMentor: payload.data.open_to_mentor,
    openToOpportunities: payload.data.open_to_opportunities,
    openToCollaborate: payload.data.open_to_collaborate,
    openToSpeaking: payload.data.open_to_speaking,
    publicFields: payload.data.public_fields,
    consentGiven: true,
    onboardingCompleted: true,
    authProvider: "linkedin",
    updatedAt: new Date(),
  };

  // The row is always found by the signed-in LinkedIn account, never by the email in the body:
  // matching on a posted email let anyone take over another member's row (security audit, 30 sep).
  const [own] = await db.select().from(members).where(eq(members.userId, userId)).limit(1);
  const [holder] = await db
    .select({ id: members.id, userId: members.userId })
    .from(members)
    .where(sql`lower(${members.email}) = ${email}`)
    .limit(1);

  // A row with this email that is not ours may only be claimed when nobody holds it yet (CSV
  // import) and the email is the one LinkedIn verified for this session.
  const sessionEmail = session.user.email?.trim().toLowerCase() ?? null;
  const claim = holder && holder.id !== own?.id ? holder : null;
  if (claim && (claim.userId || own || sessionEmail !== email)) {
    return NextResponse.json(
      { error: "Dit e-mailadres hoort bij een ander account. Gebruik je eigen e-mailadres of neem contact op met IN-IT." },
      { status: 409 },
    );
  }

  // Existing members keep their status (an approved member editing their profile stays
  // approved); new rows start as 'pending' (FR-019 review workflow).
  const [member] = own
    ? await db.update(members).set(profile).where(eq(members.id, own.id)).returning()
    : claim
      ? await db.update(members).set({ ...profile, userId }).where(eq(members.id, claim.id)).returning()
      : await db.insert(members).values({ ...profile, userId, visibilityStatus: "pending" }).returning();

  await db
    .insert(linkedinAccounts)
    .values({
      userId,
      memberId: member.id,
      linkedinSub: userId,
      linkedinEmail: sessionEmail,
      linkedinName: payload.data.full_name,
      linkedinPicture: payload.data.photo_url,
      provider: "linkedin",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: linkedinAccounts.linkedinSub,
      set: {
        memberId: member.id,
        linkedinName: payload.data.full_name,
        linkedinPicture: payload.data.photo_url,
        lastSyncedAt: new Date(),
      },
    });

  return NextResponse.json({ member: memberFromRow(member) });
}
