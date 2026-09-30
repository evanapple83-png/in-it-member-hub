import { EventsManagement } from "@/components/admin/EventsManagement";
import { listAllEventsForAdmin } from "@/lib/events";

export default async function AdminEventsPage() {
  const events = await listAllEventsForAdmin();
  return <EventsManagement events={events} />;
}
