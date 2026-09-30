import { CommunitiesManagement } from "@/components/admin/CommunitiesManagement";
import { listCommunitiesForAdmin } from "@/lib/communities";

export default async function AdminCommunitiesPage() {
  const communities = await listCommunitiesForAdmin();
  return <CommunitiesManagement communities={communities} />;
}
