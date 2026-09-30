import type { ReactNode } from "react";
import { AppShellClient } from "@/components/app/AppShellClient";
import { getAdminRoleForUser, requireApprovedAccess } from "@/lib/access-state";
import { getMyGroups, getOpenAgendaCount, getSearchIndex } from "@/lib/shell-data";

// Member hub shell (server part): gate + the data the sidebar, badges and ⌘K need.
export async function AppShell({ children }: { children: ReactNode }) {
  const { member, userId } = await requireApprovedAccess();
  const [adminRole, groups, agendaCount, searchIndex] = await Promise.all([
    getAdminRoleForUser(userId),
    getMyGroups(member.id),
    getOpenAgendaCount(member.id),
    getSearchIndex(member.id),
  ]);

  return (
    <AppShellClient
      me={{
        id: member.id,
        name: member.fullName,
        photoUrl: member.photoUrl,
        isAdmin: Boolean(adminRole),
        // Approved members with consent always have a page in the directory.
        profileHref: `/members/${member.id}`,
      }}
      agendaCount={agendaCount}
      groups={groups}
      searchIndex={searchIndex}
    >
      {children}
    </AppShellClient>
  );
}
