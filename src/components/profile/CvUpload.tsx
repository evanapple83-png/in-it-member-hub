"use client";

import { useEffect, useRef, useState } from "react";

type Cv = { filename: string; size: number; uploadedAt: string; downloadUrl: string };

export function CvUpload() {
  const [cv, setCv] = useState<Cv | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/cv").then(async (response) => {
      if (!response.ok) throw new Error("Je cv laden lukte niet. Vernieuw de pagina.");
      const data = await response.json();
      if (!cancelled) { setCv(data.cv); setLoaded(true); }
    }).catch((error: Error) => { if (!cancelled) setError(error.message); });
    return () => { cancelled = true; };
  }, []);

  async function upload(file: File) {
    setError(null);
    if (!/\.pdf$/i.test(file.name)) { setError("Kies een PDF-bestand."); return; }
    if (!file.size || file.size > 4 * 1024 * 1024) { setError("Kies een PDF-bestand van maximaal 4 MB."); return; }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/me/cv", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Uploaden lukte niet.");
      setCv(data.cv);
    } catch (error) { setError(error instanceof Error ? error.message : "Uploaden lukte niet. Probeer opnieuw."); }
    finally { setBusy(false); }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/me/cv", { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Verwijderen lukte niet.");
      }
      setCv(null);
    } catch (error) { setError(error instanceof Error ? error.message : "Verwijderen lukte niet. Probeer opnieuw."); }
    finally { setBusy(false); }
  }

  return (
    <div className="stack" aria-busy={busy || !loaded}>
      <p className="muted" style={{ fontSize: 14 }}>Upload je cv als PDF (maximaal 4 MB). Alleen jij en de beheerders kunnen het downloaden.</p>
      {cv ? (
        <p><a href={cv.downloadUrl} className="link">{cv.filename}</a> <span className="muted">({Math.ceil(cv.size / 1024)} KB)</span></p>
      ) : loaded ? <p className="muted">Je hebt nog geen cv geüpload.</p> : <p className="muted">Cv laden...</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button type="button" className="btn ghost" disabled={busy || !loaded} onClick={() => input.current?.click()}>
          {busy ? "Even wachten..." : cv ? "Cv vervangen" : "Cv uploaden"}
        </button>
        {cv ? <button type="button" className="btn ghost danger" disabled={busy} onClick={remove}>Cv verwijderen</button> : null}
      </div>
      <input ref={input} type="file" accept="application/pdf,.pdf" aria-label="Cv als PDF kiezen" hidden onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) void upload(file);
        event.target.value = "";
      }} />
      {error ? <p role="alert" className="msg err">{error}</p> : null}
    </div>
  );
}
