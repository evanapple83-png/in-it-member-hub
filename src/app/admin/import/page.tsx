import Link from "next/link";
import { CsvImport } from "@/components/admin/CsvImport";

export default function AdminImportPage() {
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
