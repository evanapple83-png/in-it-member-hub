import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function PendingMembersPage() {
  return (
    <PageShell eyebrow="Admin" title="Pending approvals" description="Only approved and consented members can appear publicly.">
      <AdminClient view="pending" />
    </PageShell>
  );
}
