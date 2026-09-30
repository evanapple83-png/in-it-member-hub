import { EventsManagement } from "@/components/admin/EventsManagement";
import { listAllEventsForAdmin } from "@/lib/events";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminEventsPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const events = await listAllEventsForAdmin();
  return <EventsManagement events={events} />;
}
