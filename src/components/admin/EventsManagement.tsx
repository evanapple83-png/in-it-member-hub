"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarDays, Eye, EyeOff, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { CommunityEvent } from "@/lib/types";

type Draft = {
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  description: string;
  meet_link: string;
  calendar_link: string;
  category: string;
};

const emptyDraft: Draft = {
  title: "",
  starts_at: "",
  ends_at: "",
  location: "",
  description: "",
  meet_link: "",
  calendar_link: "",
  category: "community",
};

function toIso(localValue: string) {
  return localValue ? new Date(localValue).toISOString() : "";
}

export function EventsManagement() {
  const { status: sessionStatus } = useSession();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized">("loading");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [notify, setNotify] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/events");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("unauthorized");
      setError(body.error ?? "Niet geautoriseerd.");
      return;
    }
    setEvents(body.events ?? []);
    setState("ready");
  }

  useEffect(() => {
    if (sessionStatus === "loading") return;
    async function init() {
      if (sessionStatus !== "authenticated") {
        setState("unauthorized");
        setError("Log in als coordinator om activiteiten te beheren.");
        return;
      }
      try {
        await load();
      } catch {
        setState("unauthorized");
        setError("Activiteitenbeheer is beveiligd. Log in als coordinator om verder te gaan.");
      }
    }
    void init();
  }, [sessionStatus]);

  async function create() {
    if (!draft.title || !draft.starts_at) {
      setError("Titel en startdatum zijn verplicht.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title,
        description: draft.description,
        location: draft.location,
        starts_at: toIso(draft.starts_at),
        ends_at: toIso(draft.ends_at),
        category: draft.category,
        meet_link: draft.meet_link,
        calendar_link: draft.calendar_link,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Aanmaken mislukt.");
      return;
    }
    setDraft(emptyDraft);
    await load();
  }

  async function mutate(id: string, payload: Record<string, unknown>, method: "PATCH" | "DELETE" = "PATCH") {
    const response = await fetch(`/api/admin/events/${id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "DELETE" ? undefined : JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Actie mislukt.");
      return;
    }
    await load();
  }

  if (state === "loading") return <LoadingSkeleton className="h-72" />;

  if (state === "unauthorized") {
    return (
      <div className="rounded-[2rem] border border-date/15 bg-white/78 p-8 shadow-sm">
        <ShieldAlert className="h-10 w-10 text-date" />
        <h2 className="mt-4 text-2xl font-black text-charcoal">Activiteitenbeheer beveiligd</h2>
        <p className="mt-3 max-w-2xl leading-7 text-charcoal/66">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-deep-blue text-white">
            <Plus className="h-5 w-5" />
          </span>
          <h2 className="text-2xl font-black text-charcoal">Nieuwe activiteit</h2>
        </div>
        <div className="mt-5 grid gap-4">
          <Field label="Titel *" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start *" type="datetime-local" value={draft.starts_at} onChange={(value) => setDraft({ ...draft, starts_at: value })} />
            <Field label="Einde" type="datetime-local" value={draft.ends_at} onChange={(value) => setDraft({ ...draft, ends_at: value })} />
          </div>
          <Field label="Locatie" value={draft.location} onChange={(value) => setDraft({ ...draft, location: value })} />
          <label className="grid gap-1.5 text-sm font-bold text-charcoal">
            Omschrijving
            <Textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Google Meet-link" value={draft.meet_link} onChange={(value) => setDraft({ ...draft, meet_link: value })} placeholder="https://meet.google.com/..." />
            <Field label="Google Agenda-link" value={draft.calendar_link} onChange={(value) => setDraft({ ...draft, calendar_link: value })} placeholder="https://calendar.google.com/..." />
          </div>
          {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}
          <div className="flex items-center gap-3">
            <Button onClick={create} disabled={saving}>
              {saving ? "Opslaan..." : "Activiteit aanmaken (concept)"}
            </Button>
            <p className="text-xs text-charcoal/50">Aangemaakt als concept. Publiceer hieronder om zichtbaar te maken.</p>
          </div>
        </div>
      </div>

      <label className="flex w-fit items-center gap-3 rounded-2xl bg-sand/35 px-4 py-2.5 text-sm font-bold text-charcoal">
        <input type="checkbox" checked={notify} onChange={(event) => setNotify(event.target.checked)} />
        E-mailnotificatie sturen bij publiceren (FR-026)
      </label>

      <div className="grid gap-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-3xl border border-charcoal/10 bg-white/82 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-charcoal">{event.title}</h3>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${event.status === "published" ? "bg-deep-blue/10 text-deep-blue" : "bg-charcoal/8 text-charcoal/60"}`}>
                    {event.status === "published" ? "Gepubliceerd" : "Concept"}
                  </span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-charcoal/60">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(event.starts_at).toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" })}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {event.status === "published" ? (
                  <Button size="sm" variant="outline" onClick={() => mutate(event.id, { action: "unpublish" })}>
                    <EyeOff className="h-4 w-4" />
                    Depubliceren
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => mutate(event.id, { action: "publish", notify })}>
                    <Eye className="h-4 w-4" />
                    Publiceren
                  </Button>
                )}
                <Button size="icon" variant="danger" onClick={() => mutate(event.id, {}, "DELETE")} aria-label="Verwijderen">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 ? <p className="text-sm font-semibold text-charcoal/55">Nog geen activiteiten aangemaakt.</p> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-bold text-charcoal">
      {label}
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
