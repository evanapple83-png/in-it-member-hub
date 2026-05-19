"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvImport() {
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<string | null>(null);

  function parse(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => setRows(parsed.data),
    });
  }

  async function submit() {
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rows }),
    });
    const body = await response.json().catch(() => ({}));
    setResult(response.ok ? `Imported ${body.inserted ?? 0} pending members. ${body.errors?.length ?? 0} errors.` : body.error ?? "Import failed.");
  }

  return (
    <div className="rounded-3xl border border-charcoal/10 bg-white/74 p-6 shadow-sm">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-charcoal/18 bg-sand/20 p-10 text-center">
        <Upload className="h-8 w-8 text-date" />
        <span className="mt-3 font-black text-charcoal">Upload CSV fallback</span>
        <span className="mt-1 text-sm text-charcoal/58">Imported members default to pending and need approval.</span>
        <input type="file" accept=".csv" className="sr-only" onChange={(event) => event.target.files?.[0] && parse(event.target.files[0])} />
      </label>
      {rows.length ? (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-charcoal/62">{rows.length} rows parsed</p>
          <Button onClick={submit}>Validate and import</Button>
        </div>
      ) : null}
      {result ? <p className="mt-4 rounded-2xl bg-dutch-blue/12 p-3 text-sm font-semibold text-deep-blue">{result}</p> : null}
    </div>
  );
}
