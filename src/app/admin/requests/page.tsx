import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { getReviewQueue } from "@/lib/admin-data";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminRequestsPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const { pendingMembers, openRequests } = await getReviewQueue();
  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Aanvragen</h1>
          <p>Nieuwe accounts en toegangsaanvragen, op één plek.</p>
        </div>
      </div>
      <ReviewQueue pendingMembers={pendingMembers} openRequests={openRequests} variant="requests" />
    </div>
  );
}
