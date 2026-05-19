import type { MemberRow, NewMemberRow } from "@/db/schema";
import type { Member } from "@/lib/types";

export function memberFromRow(row: MemberRow): Member {
  return {
    id: row.id,
    user_id: row.userId,
    full_name: row.fullName,
    email: row.email,
    linkedin_url: row.linkedinUrl,
    photo_url: row.photoUrl,
    headline: row.headline,
    role: row.role,
    company: row.company,
    location: row.location,
    about: row.about,
    skills: row.skills,
    can_help_with: row.canHelpWith,
    looking_for: row.lookingFor,
    languages: row.languages,
    open_to_mentor: row.openToMentor,
    open_to_opportunities: row.openToOpportunities,
    open_to_collaborate: row.openToCollaborate,
    open_to_speaking: row.openToSpeaking,
    visibility_status: row.visibilityStatus as Member["visibility_status"],
    consent_given: row.consentGiven,
    onboarding_completed: row.onboardingCompleted,
    auth_provider: row.authProvider,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function memberToInsert(member: Partial<Member> & Pick<Member, "full_name" | "email">): NewMemberRow {
  return {
    userId: member.user_id ?? null,
    fullName: member.full_name,
    email: member.email,
    linkedinUrl: member.linkedin_url ?? null,
    photoUrl: member.photo_url ?? null,
    headline: member.headline ?? null,
    role: member.role ?? null,
    company: member.company ?? null,
    location: member.location ?? null,
    about: member.about ?? null,
    skills: member.skills ?? [],
    canHelpWith: member.can_help_with ?? [],
    lookingFor: member.looking_for ?? [],
    languages: member.languages ?? [],
    openToMentor: member.open_to_mentor ?? false,
    openToOpportunities: member.open_to_opportunities ?? false,
    openToCollaborate: member.open_to_collaborate ?? false,
    openToSpeaking: member.open_to_speaking ?? false,
    visibilityStatus: member.visibility_status ?? "pending",
    consentGiven: member.consent_given ?? false,
    onboardingCompleted: member.onboarding_completed ?? false,
    authProvider: member.auth_provider ?? "linkedin",
  };
}
