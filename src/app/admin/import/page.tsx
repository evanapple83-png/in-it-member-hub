import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminImportPage() {
  return (
    <PageShell eyebrow="Admin" title="CSV import fallback" description="CSV import is admin-only and never publishes profiles directly.">
      <AdminClient view="import" />
    </PageShell>
  );
}
