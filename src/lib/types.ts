export type VisibilityStatus = "pending" | "approved" | "hidden" | "rejected" | "deactivated";

export type MemberType = "member" | "friend";

// Profile field keys that can be individually exposed on the public profile page (BP-004, FR-013)
export type PublicFieldKey =
  | "photo_url"
  | "headline"
  | "role"
  | "company"
  | "location"
  | "about"
  | "skills"
  | "can_help_with"
  | "languages"
  | "linkedin_url";

export type Member = {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  linkedin_url?: string | null;
  photo_url?: string | null;
  headline?: string | null;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  about?: string | null;
  skills: string[];
  can_help_with: string[];
  looking_for: string[];
  languages: string[];
  open_to_mentor: boolean;
  open_to_opportunities: boolean;
  open_to_collaborate: boolean;
  open_to_speaking: boolean;
  member_type: MemberType;
  public_fields: string[];
  email_opt_out: boolean;
  visibility_status: VisibilityStatus;
  consent_given: boolean;
  onboarding_completed?: boolean;
  auth_provider?: string;
  created_at: string;
  updated_at?: string;
};

export type EventStatus = "draft" | "published";
export type RsvpStatus = "going" | "maybe" | "declined";

export type CommunityEvent = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  location?: string | null;
  starts_at: string;
  ends_at?: string | null;
  category: string;
  meet_link?: string | null;
  calendar_link?: string | null;
  google_event_id?: string | null;
  cover_image_url?: string | null;
  status: EventStatus;
  audience: string;
  created_at: string;
  updated_at?: string;
  // Optional aggregates / per-viewer state attached by the data layer
  rsvp_counts?: Partial<Record<RsvpStatus, number>>;
  my_rsvp?: RsvpStatus | null;
};

export type CommunityMemberSummary = {
  id: string;
  full_name: string;
  headline?: string | null;
  role?: string | null;
  photo_url?: string | null;
  community_role: string;
};

export type CommunityPost = {
  id: string;
  community_id: string;
  body: string;
  status: "published" | "hidden";
  created_at: string;
  author_id?: string | null;
  author_name: string;
  author_photo?: string | null;
  author_role?: string | null;
};

// Phase 6: ledenblog (besloten). Auteursvelden komen uit de members-join.
export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  body: string;
  cover_image_url?: string | null;
  status: "published" | "hidden";
  showcased_at?: string | null;
  created_at: string;
  updated_at?: string;
  author_id?: string | null;
  author_name: string;
  author_photo?: string | null;
  author_role?: string | null;
};

export type AccessRequest = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  requester_type: MemberType;
  motivation?: string | null;
  linkedin_url?: string | null;
  proposed_by_member_id?: string | null;
  status: "requested" | "approved" | "rejected";
  review_note?: string | null;
  reviewed_by_admin_id?: string | null;
  reviewed_at?: string | null;
  invite_id?: string | null;
  created_at: string;
  updated_at?: string;
};

export type LinkedInAccount = {
  id?: string;
  user_id: string;
  member_id?: string | null;
  linkedin_sub: string;
  linkedin_email?: string | null;
  linkedin_name?: string | null;
  linkedin_picture?: string | null;
  provider: "linkedin";
  connected_at: string;
  last_synced_at: string;
};

export type MemberSort = "newest" | "name" | "most-skills";
