import { MemberManagementTable } from "@/components/admin/MemberManagementTable";
import type { Member } from "@/lib/types";

export function PendingMembersTable({ members }: { members: Member[] }) {
  return <MemberManagementTable members={members} pendingOnly />;
}
