import { redirect } from "next/navigation";
import { MembersView, type DirectoryMember } from "@/components/app/community/MembersView";
import { isApprovedMember } from "@/lib/access";
import { getPublicMembers } from "@/lib/members";

export const metadata = { title: "Leden | IN-IT" };

export default async function MembersPage() {
  if (!(await isApprovedMember())) redirect("/join?locked=members");

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
    <div className="page">
      <div className="hello">
        <div>
          <h1>Leden</h1>
          <p>Vind iemand op vakgebied, rol of waar ze voor openstaan.</p>
        </div>
      </div>
      <MembersView members={directory} />
    </div>
  );
}
