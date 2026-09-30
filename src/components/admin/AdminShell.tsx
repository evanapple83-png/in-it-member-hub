import type { ReactNode } from "react";
import { AdminShellClient } from "@/components/admin/AdminShellClient";
import { requireAdminAccess } from "@/lib/access-state";
import { getAdminOpenCount } from "@/lib/shell-data";

// Beheer shell (server part): admin gate + the Aanvragen badge count.
export async function AdminShell({ children }: { children: ReactNode }) {
  const { member, userId, founderName } = await requireAdminAccess();
  const openCount = await getAdminOpenCount();
  return (
    <AdminShellClient me={{ id: member?.id ?? userId ?? "", name: member?.fullName ?? founderName ?? "Beheerder", photoUrl: member?.photoUrl ?? null }} openCount={openCount}>
      {children}
    </AdminShellClient>
  );
}
