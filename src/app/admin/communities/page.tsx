import { CommunitiesManagement } from "@/components/admin/CommunitiesManagement";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminCommunitiesPage() {
  return (
    <PageShell
      eyebrow="Admin · Beheerder"
      title="Communities beheren"
      description="Maak professionele en sociale communities aan, pas ze aan of verwijder ze. Nieuwe communities zijn direct zichtbaar voor geautoriseerde leden."
    >
      <CommunitiesManagement />
    </PageShell>
  );
}
