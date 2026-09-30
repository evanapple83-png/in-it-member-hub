import type { AccessRequestRow, EventRow, MemberRow, NewMemberRow } from "@/db/schema";
import type { AccessRequest, CommunityEvent, Member } from "@/lib/types";

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
    member_type: row.memberType as Member["member_type"],
    public_fields: row.publicFields,
    email_opt_out: row.emailOptOut,
    visibility_status: row.visibilityStatus as Member["visibility_status"],
    consent_given: row.consentGiven,
    rejection_reason: row.rejectionReason ?? null,
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
    memberType: member.member_type ?? "member",
    publicFields: member.public_fields ?? [],
    emailOptOut: member.email_opt_out ?? false,
    visibilityStatus: member.visibility_status ?? "pending",
    consentGiven: member.consent_given ?? false,
    onboardingCompleted: member.onboarding_completed ?? false,
    authProvider: member.auth_provider ?? "linkedin",
  };
}

export function eventFromRow(row: EventRow): CommunityEvent {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    location: row.location,
    starts_at: row.startsAt.toISOString(),
    ends_at: row.endsAt?.toISOString() ?? null,
    category: row.category,
    meet_link: row.meetLink,
    calendar_link: row.calendarLink,
    google_event_id: row.googleEventId,
    cover_image_url: row.coverImageUrl,
    status: row.status as CommunityEvent["status"],
    audience: row.audience,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function accessRequestFromRow(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    full_name: row.fullName,
    email: row.email,
    phone: row.phone,
    requester_type: row.requesterType as AccessRequest["requester_type"],
    motivation: row.motivation,
    linkedin_url: row.linkedinUrl,
    proposed_by_member_id: row.proposedByMemberId,
    status: row.status as AccessRequest["status"],
    review_note: row.reviewNote,
    reviewed_by_admin_id: row.reviewedByAdminId,
    reviewed_at: row.reviewedAt?.toISOString() ?? null,
    invite_id: row.inviteId,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}
