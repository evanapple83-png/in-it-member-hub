import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminMembersPage() {
  return (
    <PageShell eyebrow="Admin" title="All members" description="Approve, reject, hide, edit or delete member records.">
      <AdminClient view="members" />
    </PageShell>
  );
}
