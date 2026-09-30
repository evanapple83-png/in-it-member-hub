"use client";

import Link from "next/link";
import Papa from "papaparse";
import { useState } from "react";
import { Panel } from "@/components/app/Panel";
import { Icon } from "@/components/ui/icon";

type Result = { inserted: number; errors: string[] } | { error: string };

export function CsvImport() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  function parse(file: File) {
    setResult(null);
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => setRows(parsed.data),
    });
  }

  async function submit() {
    setBusy(true);
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setResult(response.ok ? { inserted: body.inserted ?? 0, errors: body.errors ?? [] } : { error: body.error ?? "Importeren lukte niet." });
    if (response.ok) setRows([]);
  }

  return (
    <Panel>
      <label
        style={{
          display: "grid",
          justifyItems: "center",
          gap: 8,
          textAlign: "center",
          padding: "34px 20px",
          borderRadius: 16,
          border: "1px dashed var(--line-strong)",
          background: "var(--canvas)",
          cursor: "pointer",
        }}
      >
        <span className="halo" style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff", display: "grid", placeItems: "center", color: "var(--accent)" }}>
          <Icon name="list" />
        </span>
        <b style={{ fontWeight: 500 }}>{fileName ?? "Kies een CSV-bestand"}</b>
        <small className="muted">
          Kolommen: full_name en email zijn verplicht. Optioneel: linkedin_url, headline, role, company, location, about.
        </small>
        <input
          type="file"
          accept=".csv,text/csv"
          className="sr-only-x"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) parse(file);
          }}
        />
      </label>

      {rows.length ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <p className="muted">
            {rows.length} {rows.length === 1 ? "rij" : "rijen"} gevonden
          </p>
          <button className="btn primary" type="button" onClick={submit} disabled={busy}>
            {busy ? "Bezig..." : "Controleren en importeren"}
          </button>
        </div>
      ) : null}

      {result ? (
        "error" in result ? (
          <p role="alert" style={{ color: "var(--accent)", fontSize: 14, marginTop: 14 }}>
            {result.error}
          </p>
        ) : (
          <div style={{ marginTop: 14, display: "grid", gap: 8 }} role="status">
            <p>
              {result.inserted} {result.inserted === 1 ? "lid" : "leden"} geïmporteerd.{" "}
              {result.inserted ? (
                <Link href="/admin/members" style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Bekijk ze bij Leden
                </Link>
              ) : null}
            </p>
            {result.errors.length ? (
              <ul className="muted" style={{ fontSize: 13.5, display: "grid", gap: 4 }}>
                {result.errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            ) : null}
          </div>
        )
      ) : null}
    </Panel>
  );
}
