import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { getReviewQueue } from "@/lib/admin-data";

export default async function AdminRequestsPage() {
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
