import Link from "next/link";
import { CsvImport } from "@/components/admin/CsvImport";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminImportPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Leden importeren</h1>
          <p>Voor wie niet via LinkedIn binnenkomt. Geïmporteerde leden wachten altijd eerst op goedkeuring.</p>
        </div>
        <Link className="btn ghost" href="/admin/members">
          Terug naar leden
        </Link>
      </div>
      <CsvImport />
    </div>
  );
}
