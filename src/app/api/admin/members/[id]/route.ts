import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { members } from "@/db/schema";
import { memberFromRow } from "@/db/mapper";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const memberPatchSchema = z
  .object({
    visibility_status: z.enum(["pending", "approved", "hidden", "rejected", "deactivated"]).optional(),
    member_type: z.enum(["member", "friend"]).optional(),
    full_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    linkedin_url: z.string().nullable().optional(),
    photo_url: z.string().nullable().optional(),
    headline: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    company: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    skills: z.array(z.string()).optional(),
    can_help_with: z.array(z.string()).optional(),
    looking_for: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    open_to_mentor: z.boolean().optional(),
    open_to_opportunities: z.boolean().optional(),
    open_to_collaborate: z.boolean().optional(),
    open_to_speaking: z.boolean().optional(),
    consent_given: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "No changes provided.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const payload = memberPatchSchema.safeParse(await request.json());
  if (!payload.success) return NextResponse.json({ error: "Invalid member update." }, { status: 400 });
  const { id } = await params;
  const changes = payload.data;
  const [row] = await admin.db
    .update(members)
    .set({
      ...(changes.visibility_status ? { visibilityStatus: changes.visibility_status } : {}),
      ...(changes.member_type ? { memberType: changes.member_type } : {}),
      ...(changes.full_name ? { fullName: changes.full_name } : {}),
      ...(changes.email ? { email: changes.email } : {}),
      ...(changes.linkedin_url !== undefined ? { linkedinUrl: changes.linkedin_url || null } : {}),
      ...(changes.photo_url !== undefined ? { photoUrl: changes.photo_url || null } : {}),
      ...(changes.headline !== undefined ? { headline: changes.headline || null } : {}),
      ...(changes.role !== undefined ? { role: changes.role || null } : {}),
      ...(changes.company !== undefined ? { company: changes.company || null } : {}),
      ...(changes.location !== undefined ? { location: changes.location || null } : {}),
      ...(changes.about !== undefined ? { about: changes.about || null } : {}),
      ...(changes.skills ? { skills: changes.skills } : {}),
      ...(changes.can_help_with ? { canHelpWith: changes.can_help_with } : {}),
      ...(changes.looking_for ? { lookingFor: changes.looking_for } : {}),
      ...(changes.languages ? { languages: changes.languages } : {}),
      ...(changes.open_to_mentor !== undefined ? { openToMentor: changes.open_to_mentor } : {}),
      ...(changes.open_to_opportunities !== undefined ? { openToOpportunities: changes.open_to_opportunities } : {}),
      ...(changes.open_to_collaborate !== undefined ? { openToCollaborate: changes.open_to_collaborate } : {}),
      ...(changes.open_to_speaking !== undefined ? { openToSpeaking: changes.open_to_speaking } : {}),
      ...(changes.consent_given !== undefined ? { consentGiven: changes.consent_given } : {}),
      updatedAt: new Date(),
    })
    .where(eq(members.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Member not found." }, { status: 404 });
  return NextResponse.json({ member: memberFromRow(row) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { id } = await params;
  await admin.db.delete(members).where(eq(members.id, id));
  return NextResponse.json({ ok: true });
}
