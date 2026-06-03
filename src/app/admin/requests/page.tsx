import { AdminClient } from "@/components/admin/AdminClient";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminRequestsPage() {
  return (
    <PageShell
      eyebrow="Admin"
      title="Toegangsaanvragen"
      description="Beoordeel en registreer toegangsaanvragen. Goedkeuren verstuurt automatisch een eenmalige activeringscode."
    >
      <AdminClient view="requests" />
    </PageShell>
  );
}
