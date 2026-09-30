import { NextResponse } from "next/server";
import { z } from "zod";
import { or, eq } from "drizzle-orm";
import { members } from "@/db/schema";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { splitTags } from "@/lib/utils";

const csvRowSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  linkedin_url: z.string().optional().default(""),
  photo_url: z.string().optional().default(""),
  headline: z.string().optional().default(""),
  role: z.string().optional().default(""),
  company: z.string().optional().default(""),
  location: z.string().optional().default(""),
  about: z.string().optional().default(""),
  skills: z.string().optional().default(""),
  can_help_with: z.string().optional().default(""),
  looking_for: z.string().optional().default(""),
  languages: z.string().optional().default(""),
  open_to_mentor: z.string().optional().default("false"),
  open_to_opportunities: z.string().optional().default("false"),
  open_to_collaborate: z.string().optional().default("false"),
  open_to_speaking: z.string().optional().default("false"),
});

const requestSchema = z.object({ rows: z.array(z.record(z.string(), z.string())) });

export async function POST(request: Request) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const payload = requestSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Het bestand kon niet worden gelezen." }, { status: 400 });

  const errors: string[] = [];
  let inserted = 0;

  for (const [index, row] of payload.data.rows.entries()) {
    const parsed = csvRowSchema.safeParse(row);
    if (!parsed.success) {
      errors.push(`Rij ${index + 1}: naam of e-mail ontbreekt of klopt niet.`);
      continue;
    }
    const duplicateConditions = parsed.data.linkedin_url
      ? or(eq(members.email, parsed.data.email), eq(members.linkedinUrl, parsed.data.linkedin_url))
      : eq(members.email, parsed.data.email);
    const [existing] = await admin.db.select({ id: members.id }).from(members).where(duplicateConditions).limit(1);
    if (existing) {
      errors.push(`Rij ${index + 1}: dit e-mailadres of LinkedIn-profiel bestaat al.`);
      continue;
    }
    const bool = (value: string) => ["true", "1", "yes", "ja"].includes(value.toLowerCase());
    try {
      await admin.db.insert(members).values({
      fullName: parsed.data.full_name,
      email: parsed.data.email,
      linkedinUrl: parsed.data.linkedin_url || null,
      photoUrl: parsed.data.photo_url || null,
      headline: parsed.data.headline,
      role: parsed.data.role,
      company: parsed.data.company,
      location: parsed.data.location,
      about: parsed.data.about,
      skills: splitTags(parsed.data.skills),
      canHelpWith: splitTags(parsed.data.can_help_with),
      lookingFor: splitTags(parsed.data.looking_for),
      languages: splitTags(parsed.data.languages),
      openToMentor: bool(parsed.data.open_to_mentor),
      openToOpportunities: bool(parsed.data.open_to_opportunities),
      openToCollaborate: bool(parsed.data.open_to_collaborate),
      openToSpeaking: bool(parsed.data.open_to_speaking),
      visibilityStatus: "pending",
      consentGiven: false,
    });
      inserted += 1;
    } catch {
      errors.push(`Rij ${index + 1}: importeren lukte niet.`);
    }
  }

  return NextResponse.json({ inserted, errors });
}
