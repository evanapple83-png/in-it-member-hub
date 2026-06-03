"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { BellOff, Download, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// AVG §9.1 zelfbeheer op /profile: inzage (export), notificatie-opt-out en vergetelheid.
export function PrivacyControls({ initialEmailOptOut }: { initialEmailOptOut: boolean }) {
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
    <section className="mt-10 rounded-[2rem] border border-charcoal/10 bg-white/82 p-7 shadow-sm">
      <h2 className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-charcoal/45">
        <ShieldCheck className="h-4 w-4" />
        Privacy & gegevens
      </h2>

      <div className="mt-5 grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-sand/35 p-5">
          <div className="min-w-0">
            <p className="font-bold text-charcoal">E-mailnotificaties</p>
            <p className="text-sm leading-6 text-charcoal/65">
              {optOut
                ? "Je ontvangt geen e-mails over nieuwe activiteiten."
                : "Je ontvangt e-mails wanneer de coordinator een nieuwe activiteit publiceert."}
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={toggleOptOut}>
            <BellOff className="h-4 w-4" />
            {optOut ? "Weer aanzetten" : "Afmelden"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-sand/35 p-5">
          <div className="min-w-0">
            <p className="font-bold text-charcoal">Inzage in je gegevens</p>
            <p className="text-sm leading-6 text-charcoal/65">
              Download alles wat IN-IT van je bewaart als JSON-bestand (profiel, lidmaatschappen, aanmeldingen, berichten).
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/api/me/export">
              <Download className="h-4 w-4" />
              Download mijn gegevens
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-date/15 bg-date/7 p-5">
          <div className="min-w-0">
            <p className="font-bold text-charcoal">Account verwijderen</p>
            <p className="text-sm leading-6 text-charcoal/65">
              Verwijdert je profiel, LinkedIn-koppeling, lidmaatschappen en aanmeldingen definitief. Geschreven berichten
              blijven anoniem staan als &quot;Verwijderd lid&quot;.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={deleteAccount} className="border-date/30 text-date hover:bg-date/10">
            <Trash2 className="h-4 w-4" />
            Definitief verwijderen
          </Button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-semibold text-date">{error}</p> : null}
    </section>
  );
}
