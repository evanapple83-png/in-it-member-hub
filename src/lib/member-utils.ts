import type { Member, MemberSort, PublicFieldKey } from "@/lib/types";

// BP-004 / FR-012/013: the fields a member can individually opt into showing on their
// public profile page. Name is always shown once a public profile is enabled.
export const PUBLIC_FIELD_OPTIONS: { key: PublicFieldKey; label: string }[] = [
  { key: "photo_url", label: "Profielfoto" },
  { key: "headline", label: "Headline" },
  { key: "role", label: "Functie" },
  { key: "company", label: "Bedrijf" },
  { key: "location", label: "Locatie" },
  { key: "about", label: "Over mij" },
  { key: "skills", label: "Skills" },
  { key: "can_help_with", label: "Kan helpen met" },
  { key: "languages", label: "Talen" },
  { key: "linkedin_url", label: "LinkedIn-link" },
];

// A profile is publicly viewable only when approved, consented, and at least one field is shared.
export function hasPublicProfile(member: Member) {
  return member.visibility_status === "approved" && member.consent_given && member.public_fields.length > 0;
}

export function isFieldPublic(member: Member, key: PublicFieldKey) {
  return member.public_fields.includes(key);
}

const searchableFields = (member: Member) =>
  [
    member.full_name,
    member.headline,
    member.role,
    member.company,
    member.location,
    member.about,
    ...member.skills,
    ...member.can_help_with,
    ...member.looking_for,
    ...member.languages,
    member.open_to_mentor ? "mentor mentoring junior developer" : "",
    member.open_to_opportunities ? "open to work opportunities freelance" : "",
    member.open_to_collaborate ? "collaborate collaboration projects" : "",
    member.open_to_speaking ? "speaking events speaker talks" : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

export type MemberFilters = {
  query?: string;
  role?: string;
  skill?: string;
  location?: string;
  company?: string;
  open_to_mentor?: boolean;
  open_to_opportunities?: boolean;
  open_to_collaborate?: boolean;
  open_to_speaking?: boolean;
  sort?: MemberSort;
};

export function publicMembers(members: Member[]) {
  return members.filter((member) => member.visibility_status === "approved" && member.consent_given);
}

export function filterMembers(members: Member[], filters: MemberFilters) {
  const query = filters.query?.trim().toLowerCase();
  const filtered = members.filter((member) => {
    if (query && !searchableFields(member).includes(query)) return false;
    if (filters.role && member.role !== filters.role) return false;
    if (filters.skill && !member.skills.includes(filters.skill)) return false;
    if (filters.location && member.location !== filters.location) return false;
    if (filters.company && member.company !== filters.company) return false;
    if (filters.open_to_mentor && !member.open_to_mentor) return false;
    if (filters.open_to_opportunities && !member.open_to_opportunities) return false;
    if (filters.open_to_collaborate && !member.open_to_collaborate) return false;
    if (filters.open_to_speaking && !member.open_to_speaking) return false;
    return true;
  });

  return sortMembers(filtered, filters.sort ?? "newest");
}

export function sortMembers(members: Member[], sort: MemberSort) {
  return [...members].sort((a, b) => {
    if (sort === "name") return a.full_name.localeCompare(b.full_name);
    if (sort === "most-skills") return b.skills.length - a.skills.length;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function uniqueValues(members: Member[], key: keyof Pick<Member, "role" | "location" | "company">) {
  return Array.from(new Set(members.map((member) => member[key]).filter(Boolean) as string[])).sort();
}

export function uniqueSkills(members: Member[]) {
  return Array.from(new Set(members.flatMap((member) => member.skills))).sort();
}

export function similarMembers(member: Member, members: Member[]) {
  const skillSet = new Set(member.skills);
  return publicMembers(members)
    .filter((candidate) => candidate.id !== member.id)
    .map((candidate) => ({
      candidate,
      score:
        candidate.skills.filter((skill) => skillSet.has(skill)).length +
        (candidate.role === member.role ? 2 : 0) +
        (candidate.location === member.location ? 1 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.candidate);
}
