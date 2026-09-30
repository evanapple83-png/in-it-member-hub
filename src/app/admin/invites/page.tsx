import { InviteManagement } from "@/components/admin/InviteManagement";
import { listInvitesForAdmin } from "@/lib/admin-data";

export default async function AdminInvitesPage({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const [invites, params] = await Promise.all([listInvitesForAdmin(), searchParams]);
  return <InviteManagement invites={invites} openNew={params.new === "1"} />;
}
