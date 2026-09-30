import Link from "next/link";
import { MemberManagementTable } from "@/components/admin/MemberManagementTable";
import { listMembersForAdmin } from "@/lib/admin-data";

export default async function AdminMembersPage() {
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
