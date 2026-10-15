import type { Member, PublicFieldKey } from "@/lib/types";

export type PublicProfile = Pick<Member, "id" | "full_name"> & Partial<Pick<Member, PublicFieldKey>>;

const PUBLIC_KEYS: PublicFieldKey[] = [
  "photo_url", "headline", "role", "company", "location", "about",
  "skills", "can_help_with", "languages", "linkedin_url",
];

// Project before serializing to a client component: private values must not reach the browser.
export function toPublicProfile(member: Member): PublicProfile | null {
  const shared = PUBLIC_KEYS.filter((key) => member.public_fields.includes(key));
  if (member.visibility_status !== "approved" || !member.consent_given || shared.length === 0) return null;
  return {
    id: member.id,
    full_name: member.full_name,
    ...Object.fromEntries(shared.map((key) => [key, member[key]])),
  };
}
