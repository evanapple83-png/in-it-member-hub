"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useToast } from "@/components/app/Toast";
import { Icon } from "@/components/ui/icon";

// AVG §9.1 zelfbeheer op /profile: inzage (export), notificatie-opt-out en vergetelheid.
export function PrivacyControls({ initialEmailOptOut }: { initialEmailOptOut: boolean }) {
  const { toast } = useToast();
  const [optOut, setOptOut] = useState(initialEmailOptOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleOptOut() {
    const next = !optOut;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_opt_out: next }),
    });
    setBusy(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Opslaan mislukt.");
      return;
    }
    setOptOut(next);
    toast(next ? "Je krijgt geen mails meer over activiteiten" : "Mails over activiteiten staan weer aan");
  }

  async function deleteAccount() {
    if (!window.confirm("Weet je het zeker? Je profiel en gegevens worden definitief verwijderd. Dit kan niet ongedaan worden gemaakt.")) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/me", { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Verwijderen mislukt.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  return (
    <section className="panel">
      <div className="ph">
        <h3>Privacy en gegevens</h3>
      </div>

      <div className="req">
        <span className="metalist">
          <span className="ic">
            <Icon name="mail" />
          </span>
        </span>
        <div className="t">
          <b>Mails over activiteiten</b>
          <small>
            {optOut
              ? "Je ontvangt geen mails over nieuwe activiteiten."
              : "Je krijgt een mail wanneer de coördinator een nieuwe activiteit plant."}
          </small>
        </div>
        <div className="acts">
          <button type="button" className="btn ghost sm" disabled={busy} onClick={toggleOptOut}>
            {optOut ? "Weer aanzetten" : "Uitzetten"}
          </button>
        </div>
      </div>

      <div className="req">
        <span className="metalist">
          <span className="ic">
            <Icon name="inbox" />
          </span>
        </span>
        <div className="t">
          <b>Inzage in je gegevens</b>
          <small>Download alles wat IN-IT van je bewaart: profiel, groepen, aanmeldingen en berichten.</small>
        </div>
        <div className="acts">
          <a className="btn ghost sm" href="/api/me/export">
            Download mijn gegevens
          </a>
        </div>
      </div>

      <div className="req">
        <span className="metalist">
          <span className="ic" style={{ color: "var(--accent)" }}>
            <Icon name="x" />
          </span>
        </span>
        <div className="t">
          <b>Account verwijderen</b>
          <small>
            Verwijdert je profiel, LinkedIn-koppeling, groepen en aanmeldingen definitief. Wat je schreef blijft staan
            zonder naam, als &quot;Verwijderd lid&quot;.
          </small>
        </div>
        <div className="acts">
          <button type="button" className="btn ghost sm danger" disabled={busy} onClick={deleteAccount}>
            Definitief verwijderen
          </button>
        </div>
      </div>

      {error ? (
        <p className="err-line" role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
