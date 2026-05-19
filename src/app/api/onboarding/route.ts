import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { getDb, hasDatabase } from "@/db";
import { linkedinAccounts, members } from "@/db/schema";
import { memberFromRow } from "@/db/mapper";
import { authOptions } from "@/lib/auth";

const onboardingSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  linkedin_url: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
  headline: z.string().optional().nullable(),
  role: z.string().min(2),
  company: z.string().optional().nullable(),
  location: z.string().min(2),
  about: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  can_help_with: z.array(z.string()).default([]),
  looking_for: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  open_to_mentor: z.boolean().default(false),
  open_to_opportunities: z.boolean().default(false),
  open_to_collaborate: z.boolean().default(false),
  open_to_speaking: z.boolean().default(false),
  consent_given: z.literal(true),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json({ error: "Neon DATABASE_URL is not configured." }, { status: 503 });
  }

  const payload = onboardingSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "Please complete all required fields and consent." }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "LinkedIn login failed. Please sign in again." }, { status: 401 });
  }

  const db = getDb();
  const memberInput = {
    userId: session.user.id,
    fullName: payload.data.full_name,
    email: payload.data.email,
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
    visibilityStatus: "pending",
    consentGiven: true,
    onboardingCompleted: true,
    authProvider: "linkedin",
    updatedAt: new Date(),
  };

  const [member] = await db
    .insert(members)
    .values(memberInput)
    .onConflictDoUpdate({
      target: members.email,
      set: memberInput,
    })
    .returning();

  await db
    .insert(linkedinAccounts)
    .values({
      userId: session.user.id,
      memberId: member.id,
      linkedinSub: session.user.id,
      linkedinEmail: payload.data.email,
      linkedinName: payload.data.full_name,
      linkedinPicture: payload.data.photo_url,
      provider: "linkedin",
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: linkedinAccounts.linkedinSub,
      set: {
        memberId: member.id,
        linkedinEmail: payload.data.email,
        linkedinName: payload.data.full_name,
        linkedinPicture: payload.data.photo_url,
        lastSyncedAt: new Date(),
      },
    });

  return NextResponse.json({ member: memberFromRow(member) });
}
