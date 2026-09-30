import { CommunitiesManagement } from "@/components/admin/CommunitiesManagement";
import { listCommunitiesForAdmin } from "@/lib/communities";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminCommunitiesPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const communities = await listCommunitiesForAdmin();
  return <CommunitiesManagement communities={communities} />;
}
