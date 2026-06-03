"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AccessRequest } from "@/lib/types";

export function AccessRequestsClient() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<{ id: string; code: string; emailed: boolean } | null>(null);

  async function load() {
    const response = await fetch("/api/admin/requests");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Kon aanvragen niet laden.");
    setRequests(body.requests ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    const note = action === "reject" ? window.prompt("Reden voor afwijzing (optioneel):") ?? undefined : undefined;
    const response = await fetch("/api/admin/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, note }),
    });
    const body = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setError(body.error ?? "Actie mislukt.");
      return;
    }
    if (action === "approve" && body.code) {
      setFreshCode({ id, code: body.code, emailed: Boolean(body.emailed) });
    }
    await load();
  }

  if (loading) return <LoadingSkeleton className="h-72" />;

  const pending = requests.filter((request) => request.status === "requested");
  const handled = requests.filter((request) => request.status !== "requested");

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-deep-blue text-white">
          <Inbox className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-2xl font-black text-charcoal">Toegangsaanvragen</h2>
          <p className="text-sm text-charcoal/60">{pending.length} openstaand · {handled.length} afgehandeld</p>
        </div>
      </div>

      {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}

      {freshCode ? (
        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-sand/45 p-4">
          <p className="font-mono text-lg font-black text-charcoal">{freshCode.code}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(freshCode.code)}>
            <Copy className="h-4 w-4" />
            Kopieer
          </Button>
          <p className="text-sm font-semibold text-charcoal/58">
            {freshCode.emailed ? "Activeringsmail verstuurd." : "E-mail niet verzonden (geen provider) — deel de code handmatig."}
          </p>
        </div>
      ) : null}

      {pending.length === 0 ? (
        <EmptyState title="Geen openstaande aanvragen" description="Nieuwe aanvragen via /request-access verschijnen hier voor beoordeling." />
      ) : (
        <div className="grid gap-3">
          {pending.map((request) => (
            <div key={request.id} className="rounded-3xl border border-charcoal/10 bg-white/82 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-charcoal">{request.full_name}</h3>
                    <span className="rounded-full bg-deep-blue/10 px-2.5 py-0.5 text-xs font-bold capitalize text-deep-blue">
                      {request.requester_type === "friend" ? "Vriend" : "Lid"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal/64">{request.email}{request.phone ? ` · ${request.phone}` : ""}</p>
                  {request.linkedin_url ? (
                    <a href={request.linkedin_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-deep-blue underline-offset-2 hover:underline">
                      LinkedIn-profiel
                    </a>
                  ) : null}
                  {request.motivation ? <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/70">{request.motivation}</p> : null}
                  <p className="mt-2 text-xs text-charcoal/45">Aangevraagd {new Date(request.created_at).toLocaleString("nl-NL")}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" size="sm" disabled={busyId === request.id} onClick={() => review(request.id, "approve")}>
                    <Check className="h-4 w-4" />
                    Goedkeuren
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={busyId === request.id} onClick={() => review(request.id, "reject")}>
                    <X className="h-4 w-4" />
                    Afwijzen
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {handled.length > 0 ? (
        <div className="overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white/78 shadow-sm">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-4 border-b border-charcoal/10 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-charcoal/50">
            <span>Naam</span>
            <span>Type</span>
            <span>Status</span>
          </div>
          {handled.map((request) => (
            <div key={request.id} className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-4 border-b border-charcoal/8 px-5 py-3 text-sm">
              <span className="font-semibold text-charcoal">{request.full_name}</span>
              <span className="capitalize text-charcoal/60">{request.requester_type === "friend" ? "Vriend" : "Lid"}</span>
              <span className={`font-bold capitalize ${request.status === "approved" ? "text-deep-blue" : "text-date"}`}>
                {request.status === "approved" ? "Goedgekeurd" : "Afgewezen"}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
