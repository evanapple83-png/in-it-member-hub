export type VisibilityStatus = "pending" | "approved" | "hidden" | "rejected";

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
  visibility_status: VisibilityStatus;
  consent_given: boolean;
  onboarding_completed?: boolean;
  auth_provider?: string;
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
