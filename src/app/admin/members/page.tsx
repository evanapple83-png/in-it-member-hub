import Link from "next/link";
import { MemberManagementTable } from "@/components/admin/MemberManagementTable";
import { listMembersForAdmin } from "@/lib/admin-data";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminMembersPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const members = await listMembersForAdmin();
  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Leden</h1>
          <p>Status, rol en zichtbaarheid per lid.</p>
        </div>
        <Link className="btn ghost" href="/admin/import">
          Leden importeren
        </Link>
      </div>
      <MemberManagementTable members={members} />
    </div>
  );
}
