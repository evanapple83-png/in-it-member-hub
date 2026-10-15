import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { members } from "@/db/schema";
import { memberFromRow } from "@/db/mapper";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { deleteMemberCv } from "@/lib/member-cvs";
import { imageUrl, linkedinUrl, optionalUrl, readJson, shortText, tagList } from "@/lib/validation";

const memberPatchSchema = z
  .object({
    visibility_status: z.enum(["pending", "approved", "hidden", "rejected", "deactivated"]).optional(),
    member_type: z.enum(["member", "friend"]).optional(),
    full_name: shortText(120).pipe(z.string().min(2)).optional(),
    email: z.string().trim().email().max(254).optional(),
    linkedin_url: optionalUrl(linkedinUrl),
    photo_url: optionalUrl(imageUrl),
    headline: shortText(160).nullable().optional(),
    role: shortText(160).nullable().optional(),
    company: shortText(160).nullable().optional(),
    location: shortText(160).nullable().optional(),
    about: shortText(2000).nullable().optional(),
    skills: tagList.optional(),
    can_help_with: tagList.optional(),
    looking_for: tagList.optional(),
    languages: tagList.optional(),
    open_to_mentor: z.boolean().optional(),
    open_to_opportunities: z.boolean().optional(),
    open_to_collaborate: z.boolean().optional(),
    open_to_speaking: z.boolean().optional(),
    consent_given: z.boolean().optional(),
    // Optional note shown to the applicant on /wachten when rejected.
    rejection_reason: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "Er is niets gewijzigd.");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const payload = memberPatchSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "Controleer de profielgegevens en probeer opnieuw." }, { status: 400 });
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
      // Approving clears an earlier rejection note; rejecting stores the (optional) note.
      ...(changes.visibility_status === "approved"
        ? { rejectionReason: null }
        : changes.visibility_status === "rejected"
          ? { rejectionReason: changes.rejection_reason?.trim() || null }
          : changes.rejection_reason !== undefined
            ? { rejectionReason: changes.rejection_reason?.trim() || null }
            : {}),
      updatedAt: new Date(),
    })
    .where(eq(members.id, id))
    .returning();
  if (!row) return NextResponse.json({ error: "Lid niet gevonden." }, { status: 404 });
  return NextResponse.json({ member: memberFromRow(row) });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminFromRequest();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { id } = await params;
  try {
    await deleteMemberCv(id);
  } catch (error) {
    console.error("[admin:delete] cv cleanup failed", error);
    return NextResponse.json({ error: "Het cv verwijderen lukte niet. Probeer het opnieuw." }, { status: 503 });
  }
  await admin.db.delete(members).where(eq(members.id, id));
  return NextResponse.json({ ok: true });
}
