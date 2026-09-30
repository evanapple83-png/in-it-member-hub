"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { useToast } from "@/components/app/Toast";
import { Icon } from "@/components/ui/icon";
import type { PersonSummary } from "@/lib/hub";
import type { RsvpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: RsvpStatus; label: string }[] = [
  { value: "going", label: "Ik kom" },
  { value: "maybe", label: "Misschien" },
  { value: "declined", label: "Kan niet" },
];

// Event detail body: description, "Wie er komen" (live), and the RSVP segmented control.
export function EventRoom({
  eventId,
  description,
  when,
  timeLabel,
  place,
  online,
  meetLink,
  calendarLink,
  past,
  me,
  initialRsvp,
  initialAttendees,
}: {
  eventId: string;
  description: string | null;
  when: string;
  timeLabel: string;
  place: string | null;
  online: boolean;
  meetLink: string | null;
  calendarLink: string | null;
  past: boolean;
  me: PersonSummary;
  initialRsvp: RsvpStatus | null;
  initialAttendees: PersonSummary[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [rsvp, setRsvp] = useState<RsvpStatus | null>(initialRsvp);
  const [busy, setBusy] = useState(false);
  const [popMe, setPopMe] = useState(false);

  const others = initialAttendees.filter((person) => person.id !== me.id);
  const who = rsvp === "going" ? [me, ...others] : others;
  const index = OPTIONS.findIndex((option) => option.value === rsvp);

  async function choose(next: RsvpStatus) {
    if (busy || next === rsvp) return;
    const previous = rsvp;
    setBusy(true);
    setRsvp(next);
    setPopMe(next === "going");
    const response = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    }).catch(() => null);
    setBusy(false);
    if (!response?.ok) {
      setRsvp(previous);
      const data = await response?.json().catch(() => ({}));
      toast(data?.error ?? "Aanmelden lukte niet. Probeer het zo nog eens");
      return;
    }
    toast(next === "going" ? "Aangemeld. Tot dan" : next === "maybe" ? "Genoteerd als misschien" : "Jammer, genoteerd dat je niet kunt");
    router.refresh();
  }

  return (
    <div className="cols">
      <div className="stack">
        {description ? (
          <section className="panel">
            <div className="ph">
              <h3>Over deze activiteit</h3>
            </div>
            <p className="prose" style={{ whiteSpace: "pre-line" }}>
              {description}
            </p>
          </section>
        ) : null}
        <section className="panel">
          <div className="ph">
            <h3>
              {past ? "Wie er waren" : "Wie er komen"}{" "}
              <span className="badge num">
                <span className="roll">
                  <span key={who.length}>{who.length}</span>
                </span>
              </span>
            </h3>
          </div>
          {who.length ? (
            <div className="avstack">
              {who.slice(0, 12).map((person, i) => (
                <Avatar
                  key={person.id}
                  name={person.full_name}
                  photoUrl={person.photo_url}
                  id={person.id}
                  className={cn(i === 0 && popMe && person.id === me.id && "pop")}
                />
              ))}
              {who.length > 12 ? (
                <span className="av" style={{ background: "var(--canvas)", fontSize: 12 }}>
                  +{who.length - 12}
                </span>
              ) : null}
            </div>
          ) : (
            <p className="muted">{past ? "Niemand had zich aangemeld." : "Nog niemand aangemeld. Jij kunt de eerste zijn."}</p>
          )}
          {who.length ? (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              {who
                .slice(0, 3)
                .map((person) => (person.id === me.id ? "Jij" : person.full_name.split(" ")[0]))
                .join(", ")}
              {who.length > 3 ? ` en ${who.length - 3} ${who.length - 3 === 1 ? "ander" : "anderen"}` : ""}
            </p>
          ) : null}
        </section>
      </div>

      <aside className="stack aside">
        <section className="panel" style={{ display: "grid", gap: 16 }}>
          <div className="metalist">
            <div>
              <span className="ic">
                <Icon name="clock" />
              </span>
              <span>
                {when}
                <small>{timeLabel}</small>
              </span>
            </div>
            {place ? (
              <div>
                <span className="ic">
                  <Icon name={online ? "video" : "pin"} />
                </span>
                <span>
                  {place}
                  {online && !past ? <small>{rsvp === "going" ? "De link staat hieronder" : "Link verschijnt na aanmelden"}</small> : null}
                </span>
              </div>
            ) : null}
          </div>

          {past ? (
            <p className="muted" style={{ fontSize: 14 }}>
              Deze activiteit is geweest.
            </p>
          ) : (
            <>
              <div className="rsvp" role="radiogroup" aria-label="Aanmelden" aria-busy={busy}>
                <span
                  className={cn("thumb", rsvp === "going" && "going")}
                  style={{ opacity: index < 0 ? 0 : 1, transform: `translateX(${Math.max(index, 0) * 100}%)` }}
                />
                {OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={rsvp === option.value}
                    className={rsvp === option.value ? "on" : undefined}
                    onClick={() => choose(option.value)}
                    disabled={busy}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {rsvp === "going" && meetLink ? (
                <a className="btn primary" href={meetLink} target="_blank" rel="noreferrer" style={{ animation: "rise .3s var(--ease)" }}>
                  <Icon name="video" />
                  Deelnemen via Google Meet
                </a>
              ) : null}
              <a className="btn ghost" href={`/api/events/${eventId}/ics`}>
                <Icon name="calplus" />
                Zet in mijn agenda
              </a>
              {calendarLink ? (
                <a className="btn ghost" href={calendarLink} target="_blank" rel="noreferrer">
                  <Icon name="cal" />
                  Open in Google Agenda
                </a>
              ) : null}
            </>
          )}
        </section>
      </aside>
    </div>
  );
}
