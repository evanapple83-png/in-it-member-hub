import { redirect } from "next/navigation";
import { MembersDirectory } from "@/components/members/MembersDirectory";
import { PageShell } from "@/components/layout/PageShell";
import { isApprovedMember } from "@/lib/access";
import { getPublicMembers } from "@/lib/members";

export default async function MembersPage() {
  if (!(await isApprovedMember())) redirect("/join?locked=members");

  const members = await getPublicMembers();

  return (
    <PageShell
      eyebrow="Member directory"
      title="Discover trusted expertise across the IN-IT community"
      description="Search by role, skill, location, company and availability. Public results only include profiles with consent and admin approval."
    >
      <MembersDirectory members={members} />
    </PageShell>
  );
}
