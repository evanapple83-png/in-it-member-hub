"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { useToast } from "@/components/app/Toast";
import { Layer } from "@/components/app/shell/Layer";
import { Icon } from "@/components/ui/icon";
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

function dateLabel(iso: string) {
  return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusOf(event: CommunityEvent, now: number) {
  const end = new Date(event.ends_at ?? event.starts_at).getTime();
  if (end < now) return { cls: "off", label: "Afgelopen" };
  return event.status === "published" ? { cls: "ok", label: "Gepubliceerd" } : { cls: "wait", label: "Concept" };
}

// Activiteiten: table with publish/unpublish/delete per row, and a modal to create a new one
// (always as concept first; publishing can mail the members).
export function EventsManagement({ events }: { events: CommunityEvent[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(events);
  const [seen, setSeen] = useState(events);
  const [notify, setNotify] = useState(true);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  if (events !== seen) {
    setSeen(events);
    setItems(events);
  }

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => setFresh(null), 600);
    return () => window.clearTimeout(timer);
  }, [fresh]);

  const upcoming = items.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() >= now).length;

  async function mutate(event: CommunityEvent, payload: Record<string, unknown> | null, done: string) {
    setBusyId(event.id);
    setError(null);
    const response = await fetch(`/api/admin/events/${event.id}`, {
      method: payload ? "PATCH" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    const body = await response.json().catch(() => ({}));
    setBusyId(null);
    setConfirmId(null);
    if (!response.ok) {
      setError(body.error ?? "Dat lukte niet. Probeer het opnieuw.");
      return;
    }
    if (!payload) setItems((current) => current.filter((e) => e.id !== event.id));
    else if (body.event) {
      setItems((current) => current.map((e) => (e.id === event.id ? body.event : e)));
      setFresh(event.id);
    }
    const mailed = typeof body.notified === "number" && body.notified > 0 ? ` en naar ${body.notified} leden gemaild` : "";
    toast(done + mailed);
    router.refresh();
  }

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Activiteiten</h1>
          <p>
            {items.length === 0
              ? "Nog geen activiteiten. De agenda van de community is leeg."
              : upcoming === 0
                ? "Alles staat in het verleden. De agenda van de community is nu leeg."
                : `${upcoming} ${upcoming === 1 ? "activiteit staat" : "activiteiten staan"} nog op de agenda.`}
          </p>
        </div>
        <button className="btn primary" type="button" onClick={() => setOpen(true)}>
          <Icon name="plus" />
          Nieuwe activiteit
        </button>
      </div>

      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 14 }}>
          {error}
        </p>
      ) : null}

      <Panel
        action={
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Leden mailen bij publiceren
          </label>
        }
      >
        {items.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Activiteit</th>
                  <th>Datum</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only-x">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((event) => {
                  const st = statusOf(event, now);
                  const busy = busyId === event.id;
                  return (
                    <tr key={event.id} className={fresh === event.id ? "fresh" : undefined}>
                      <td>
                        <b style={{ fontWeight: 500, display: "block" }}>{event.title}</b>
                        {event.location ? <small className="muted">{event.location}</small> : null}
                      </td>
                      <td className="num">{dateLabel(event.starts_at)}</td>
                      <td>
                        <span className={`st ${st.cls}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", gap: 6 }}>
                          {event.status === "published" ? (
                            <button className="link" type="button" disabled={busy} onClick={() => mutate(event, { action: "unpublish" }, "Activiteit teruggezet naar concept")}>
                              Depubliceren
                            </button>
                          ) : (
                            <button className="link" type="button" disabled={busy} onClick={() => mutate(event, { action: "publish", notify }, "Activiteit gepubliceerd")}>
                              Publiceren
                            </button>
                          )}
                          <button
                            className="link"
                            type="button"
                            disabled={busy}
                            style={{ color: "var(--accent)" }}
                            onClick={() => (confirmId === event.id ? mutate(event, null, "Activiteit verwijderd") : setConfirmId(event.id))}
                          >
                            {confirmId === event.id ? "Zeker weten?" : "Verwijderen"}
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact icon="cal" text="Nog geen activiteiten. Maak er een met Nieuwe activiteit." />
        )}
      </Panel>

      <NewEventModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(event) => {
          setItems((current) => [event, ...current]);
          setFresh(event.id);
          setOpen(false);
          toast("Opgeslagen als concept. Publiceer hem om hem zichtbaar te maken");
          router.refresh();
        }}
      />
    </div>
  );
}

function NewEventModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (event: CommunityEvent) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }));

  async function create() {
    if (!draft.title.trim() || !draft.starts_at) {
      setError("Titel en start zijn verplicht.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: draft.title.trim(),
        description: draft.description,
        location: draft.location,
        starts_at: toIso(draft.starts_at),
        ends_at: toIso(draft.ends_at),
        category: draft.category,
        meet_link: draft.meet_link.trim(),
        calendar_link: draft.calendar_link.trim(),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok || !body.event) {
      setError(body.error ?? "Aanmaken lukte niet. Controleer de links en datums.");
      return;
    }
    setDraft(emptyDraft);
    onCreated(body.event);
  }

  return (
    <Layer open={open} kind="modal" onClose={onClose} label="Nieuwe activiteit" style={{ maxHeight: "calc(100% - 40px)", overflowY: "auto" }}>
      <h3>Nieuwe activiteit</h3>
      <p className="muted">Wordt eerst opgeslagen als concept. Leden zien hem pas na publiceren.</p>
      <label>
        Titel
        <input value={draft.title} onChange={set("title")} maxLength={160} data-autofocus />
      </label>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label>
          Start
          <input type="datetime-local" value={draft.starts_at} onChange={set("starts_at")} />
        </label>
        <label>
          Einde (optioneel)
          <input type="datetime-local" value={draft.ends_at} onChange={set("ends_at")} />
        </label>
      </div>
      <label>
        Locatie
        <input value={draft.location} onChange={set("location")} maxLength={200} />
      </label>
      <label>
        Omschrijving
        <textarea value={draft.description} onChange={set("description")} maxLength={4000} />
      </label>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <label>
          Google Meet-link
          <input value={draft.meet_link} onChange={set("meet_link")} placeholder="https://meet.google.com/..." />
        </label>
        <label>
          Google Agenda-link
          <input value={draft.calendar_link} onChange={set("calendar_link")} placeholder="https://calendar.google.com/..." />
        </label>
      </div>
      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      <div className="row">
        <button className="btn ghost" type="button" onClick={onClose}>
          Annuleren
        </button>
        <button className="btn primary" type="button" onClick={create} disabled={saving}>
          {saving ? "Opslaan..." : "Opslaan als concept"}
        </button>
      </div>
    </Layer>
  );
}
