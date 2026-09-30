import { InviteManagement } from "@/components/admin/InviteManagement";
import { listInvitesForAdmin } from "@/lib/admin-data";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminInvitesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const [invites, params] = await Promise.all([listInvitesForAdmin(), searchParams]);
  return <InviteManagement invites={invites} openNew={params.new === "1"} />;
}
