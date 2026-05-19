import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminPage() {
  return (
    <PageShell eyebrow="Admin" title="Member hub operations" description="Review approvals, monitor consent-first visibility and manage the CSV fallback flow.">
      <AdminClient view="dashboard" />
    </PageShell>
  );
}
