import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Video } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { RsvpButtons } from "@/components/events/RsvpButtons";
import { getApprovedCurrentMember } from "@/lib/access";
import { listPublishedEvents, splitEventsByTime } from "@/lib/events";
import type { CommunityEvent } from "@/lib/types";

function formatWhen(event: CommunityEvent) {
  return new Date(event.starts_at).toLocaleString("nl-NL", { dateStyle: "full", timeStyle: "short" });
}

export default async function AgendaPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=agenda");

  const events = await listPublishedEvents(member.id);
  const { upcoming, past } = splitEventsByTime(events);

  return (
    <PageShell
      eyebrow="Activiteitenagenda"
      title="Aankomende IN-IT activiteiten"
      description="Bekijk geplande activiteiten, meld je aan en neem deel via Google Meet. Zichtbaar voor ingelogde leden."
    >
      {events.length === 0 ? (
        <EmptyState title="Nog geen activiteiten" description="Zodra de coordinator een activiteit publiceert, verschijnt die hier." />
      ) : (
        <div className="grid gap-8">
          <section className="grid gap-4">
            {upcoming.length === 0 ? (
              <p className="text-sm font-semibold text-charcoal/55">Geen aankomende activiteiten gepland.</p>
            ) : (
              upcoming.map((event) => <EventRow key={event.id} event={event} />)
            )}
          </section>
          {past.length > 0 ? (
            <section>
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-charcoal/45">Afgelopen</h2>
              <div className="grid gap-4 opacity-75">
                {past.map((event) => (
                  <EventRow key={event.id} event={event} past />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </PageShell>
  );
}

function EventRow({ event, past = false }: { event: CommunityEvent; past?: boolean }) {
  return (
    <article className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-deep-blue/10 px-3 py-1 text-xs font-bold text-deep-blue">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatWhen(event)}
          </span>
          <h3 className="mt-3 text-2xl font-black text-charcoal">
            <Link href={`/agenda/${event.slug}`} className="hover:text-deep-blue">
              {event.title}
            </Link>
          </h3>
          {event.location ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-charcoal/60">
              <MapPin className="h-4 w-4" />
              {event.location}
            </p>
          ) : null}
          {event.description ? <p className="mt-3 max-w-2xl leading-7 text-charcoal/68">{event.description}</p> : null}
          {event.meet_link ? (
            <a
              href={event.meet_link}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-deep-blue underline-offset-2 hover:underline"
            >
              <Video className="h-4 w-4" />
              Deelnemen via Google Meet
            </a>
          ) : null}
        </div>
      </div>
      {!past ? (
        <div className="mt-5 border-t border-charcoal/8 pt-4">
          <RsvpButtons eventId={event.id} initial={event.my_rsvp ?? null} goingCount={event.rsvp_counts?.going ?? 0} />
        </div>
      ) : null}
    </article>
  );
}
