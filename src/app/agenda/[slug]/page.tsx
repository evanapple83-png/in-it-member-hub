import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarPlus, MapPin, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/PageShell";
import { RsvpButtons } from "@/components/events/RsvpButtons";
import { getApprovedCurrentMember } from "@/lib/access";
import { getPublishedEventBySlug } from "@/lib/events";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=agenda");

  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug, member.id);
  if (!event) notFound();

  const when = new Date(event.starts_at).toLocaleString("nl-NL", { dateStyle: "full", timeStyle: "short" });

  return (
    <PageShell eyebrow="Activiteit" title={event.title}>
      <Button asChild variant="ghost" className="mb-6">
        <Link href="/agenda">
          <ArrowLeft className="h-4 w-4" />
          Terug naar agenda
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-7 shadow-sm">
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-charcoal/65">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-date" />
              {when}
            </span>
            {event.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-date" />
                {event.location}
              </span>
            ) : null}
          </div>
          {event.description ? (
            <p className="mt-5 whitespace-pre-line leading-7 text-charcoal/72">{event.description}</p>
          ) : null}
        </div>

        <aside className="grid h-fit gap-4 rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-charcoal/45">Jouw aanmelding</p>
            <div className="mt-3">
              <RsvpButtons eventId={event.id} initial={event.my_rsvp ?? null} goingCount={event.rsvp_counts?.going ?? 0} />
            </div>
          </div>
          <div className="grid gap-2 border-t border-charcoal/8 pt-4">
            {event.meet_link ? (
              <Button asChild>
                <a href={event.meet_link} target="_blank" rel="noreferrer">
                  <Video className="h-4 w-4" />
                  Deelnemen via Google Meet
                </a>
              </Button>
            ) : null}
            {event.calendar_link ? (
              <Button asChild variant="outline">
                <a href={event.calendar_link} target="_blank" rel="noreferrer">
                  <CalendarPlus className="h-4 w-4" />
                  Toevoegen aan Google Agenda
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <a href={`/api/events/${event.id}/ics`}>
                <CalendarPlus className="h-4 w-4" />
                Download .ics
              </a>
            </Button>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
