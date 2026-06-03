import { EventsManagement } from "@/components/admin/EventsManagement";
import { PageShell } from "@/components/layout/PageShell";

export default function AdminEventsPage() {
  return (
    <PageShell
      eyebrow="Admin · Coordinator"
      title="Activiteitenagenda beheren"
      description="Maak activiteiten aan, voeg een Google Meet-link toe en publiceer ze voor de geautoriseerde leden."
    >
      <EventsManagement />
    </PageShell>
  );
}
