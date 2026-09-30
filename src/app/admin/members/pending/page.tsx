import { redirect } from "next/navigation";

// Pending approvals now live under Aanvragen.
export default function PendingMembersPage() {
  redirect("/admin/requests");
}
