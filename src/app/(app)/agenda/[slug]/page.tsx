import { notFound, redirect } from "next/navigation";
import { DateTile } from "@/components/app/DateTile";
import { HeaderCover } from "@/components/app/community/cards";
import { HeroSettle } from "@/components/app/community/CoverLink";
import { EventRoom } from "@/components/app/community/EventRoom";
import { getApprovedCurrentMember } from "@/lib/access";
import { getPublishedEventBySlug } from "@/lib/events";
import { capitalize, timeRange, weekdayDate } from "@/lib/format-nl";
import { getEventAttendees, upcomingEvents } from "@/lib/hub";

export const metadata = { title: "Activiteit | IN-IT" };

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=agenda");

  const { slug } = await params;
  const event = await getPublishedEventBySlug(slug, member.id).catch(() => null);
  if (!event) notFound();
  const attendees = await getEventAttendees(event.id);
  const past = upcomingEvents([event]).length === 0;
  const online = Boolean(event.meet_link) && !event.location;

  return (
    <div className="page" data-reveal-group>
      <HeroSettle />
      <section className="panel flush ghead">
        <HeaderCover crop={event.slug} src={event.cover_image_url} back="/agenda" backLabel="Terug naar agenda" />
        <div className="gb">
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minWidth: 0 }}>
            <DateTile date={event.starts_at} accent className="big" />
            <div style={{ minWidth: 0 }}>
              <span className="chip tag">{capitalize(event.category)}</span>
              <h1 style={{ marginTop: 8 }}>{event.title}</h1>
            </div>
          </div>
        </div>
      </section>
      <EventRoom
        eventId={event.id}
        description={event.description ?? null}
        when={capitalize(weekdayDate(event.starts_at))}
        timeLabel={timeRange(event.starts_at, event.ends_at)}
        place={event.location || (event.meet_link ? "Online" : null)}
        online={online}
        meetLink={event.meet_link ?? null}
        calendarLink={event.calendar_link ?? null}
        past={past}
        me={{ id: member.id, full_name: member.full_name, photo_url: member.photo_url ?? null, role: member.role ?? null }}
        initialRsvp={event.my_rsvp ?? null}
        initialAttendees={attendees}
      />
    </div>
  );
}
