import { MembersView, type DirectoryMember } from "@/components/app/community/MembersView";
import { isApprovedMember } from "@/lib/access";
import { getPublicMembers, getPublicProfiles } from "@/lib/members";
import { PublicMembersView } from "@/components/members/PublicMembersView";

export const metadata = { title: "Leden | IN-IT" };

export default async function MembersPage() {
  if (!(await isApprovedMember())) {
    const profiles = await getPublicProfiles();
    return (
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-32 sm:px-6 sm:pt-36 lg:px-8">
        <h1 className="text-4xl font-black tracking-tight">Leden</h1>
        <p className="mb-8 mt-3 text-charcoal/70">Ontdek de leden die hun profiel openbaar delen.</p>
        <PublicMembersView members={profiles} />
      </section>
    );
  }

  const members = await getPublicMembers();
  const directory: DirectoryMember[] = members.map((m) => ({
    id: m.id,
    name: m.full_name,
    photoUrl: m.photo_url ?? null,
    role: m.role || m.headline || null,
    place: m.location ?? null,
    mentor: m.open_to_mentor,
    opportunities: m.open_to_opportunities,
    speaker: m.open_to_speaking,
    search: [m.full_name, m.role, m.headline, m.company, m.location, ...m.skills, ...m.can_help_with]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  }));

  return (
    <div className="page" data-reveal-group>
      <div className="hello" data-reveal>
        <div>
          <h1>Leden</h1>
          <p>Vind iemand op vakgebied, rol of waar ze voor openstaan.</p>
        </div>
      </div>
      <MembersView members={directory} />
    </div>
  );
}
