import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { eventFromRow } from "@/db/mapper";
import { eventRsvps, events, members } from "@/db/schema";
import { eventPublishedEmail, sendEmail } from "@/lib/email";
import { uniqueSlug } from "@/lib/slug";
import type { CommunityEvent, RsvpStatus } from "@/lib/types";

export type EventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  category?: string;
  meetLink?: string | null;
  calendarLink?: string | null;
  coverImageUrl?: string | null;
  audience?: string;
};

// Attach RSVP counts + the viewer's own RSVP to a set of events.
async function decorate(rows: CommunityEvent[], memberId?: string | null): Promise<CommunityEvent[]> {
  if (rows.length === 0) return rows;
  const db = getDb();
  const ids = rows.map((event) => event.id);
  const rsvps = await db.select().from(eventRsvps).where(inArray(eventRsvps.eventId, ids));
  return rows.map((event) => {
    const forEvent = rsvps.filter((rsvp) => rsvp.eventId === event.id);
    const counts: Partial<Record<RsvpStatus, number>> = {};
    for (const rsvp of forEvent) {
      const status = rsvp.status as RsvpStatus;
      counts[status] = (counts[status] ?? 0) + 1;
    }
    const mine = memberId ? forEvent.find((rsvp) => rsvp.memberId === memberId)?.status ?? null : null;
    return { ...event, rsvp_counts: counts, my_rsvp: mine as RsvpStatus | null };
  });
}

export async function listPublishedEvents(memberId?: string | null): Promise<CommunityEvent[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db.select().from(events).where(eq(events.status, "published")).orderBy(asc(events.startsAt));
    return decorate(rows.map(eventFromRow), memberId);
  } catch {
    return [];
  }
}

export async function listAllEventsForAdmin(): Promise<CommunityEvent[]> {
  if (!hasDatabase()) return [];
  try {
    const db = getDb();
    const rows = await db.select().from(events).orderBy(desc(events.startsAt));
    return rows.map(eventFromRow);
  } catch {
    return [];
  }
}

export async function getPublishedEventBySlug(slug: string, memberId?: string | null): Promise<CommunityEvent | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(events)
    .where(and(eq(events.slug, slug), eq(events.status, "published")))
    .limit(1);
  if (!row) return null;
  const [decorated] = await decorate([eventFromRow(row)], memberId);
  return decorated;
}

export async function getEventById(id: string): Promise<CommunityEvent | null> {
  const db = getDb();
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return row ? eventFromRow(row) : null;
}

export async function createEvent(input: EventInput, adminId: string): Promise<CommunityEvent> {
  const db = getDb();
  const [row] = await db
    .insert(events)
    .values({
      slug: uniqueSlug(input.title, "event"),
      title: input.title,
      description: input.description ?? null,
      location: input.location ?? null,
      startsAt: input.startsAt,
      endsAt: input.endsAt ?? null,
      category: input.category ?? "community",
      meetLink: input.meetLink ?? null,
      calendarLink: input.calendarLink ?? null,
      coverImageUrl: input.coverImageUrl ?? null,
      audience: input.audience ?? "all",
      createdByAdminId: adminId,
    })
    .returning();
  return eventFromRow(row);
}

export async function updateEvent(id: string, input: Partial<EventInput>): Promise<CommunityEvent | null> {
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.meetLink !== undefined ? { meetLink: input.meetLink } : {}),
      ...(input.calendarLink !== undefined ? { calendarLink: input.calendarLink } : {}),
      ...(input.coverImageUrl !== undefined ? { coverImageUrl: input.coverImageUrl } : {}),
      ...(input.audience !== undefined ? { audience: input.audience } : {}),
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();
  return row ? eventFromRow(row) : null;
}

// FR-025 + FR-026: publishing makes an event visible and optionally notifies authorized members.
export async function publishEvent(id: string, notify: boolean): Promise<{ event: CommunityEvent; notified: number } | null> {
  const db = getDb();
  const [row] = await db
    .update(events)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(events.id, id))
    .returning();
  if (!row) return null;
  const event = eventFromRow(row);

  let notified = 0;
  if (notify) {
    const recipients = await db
      .select({ email: members.email })
      .from(members)
      .where(and(eq(members.visibilityStatus, "approved"), eq(members.emailOptOut, false)));
    const emails = recipients.map((member) => member.email).filter(Boolean);
    if (emails.length > 0) {
      const message = eventPublishedEmail(event);
      // Privacy: recipients go in bcc so members never see each other's addresses.
      for (let i = 0; i < emails.length; i += 50) {
        const chunk = emails.slice(i, i + 50);
        const sent = await sendEmail({ to: message.to, bcc: chunk, subject: message.subject, html: message.html, text: message.text });
        // Only count members that were actually reached; a failed batch must not report success.
        if (sent.ok) notified += chunk.length;
      }
    }
  }
  return { event, notified };
}

export async function unpublishEvent(id: string): Promise<CommunityEvent | null> {
  const db = getDb();
  const [row] = await db.update(events).set({ status: "draft", updatedAt: new Date() }).where(eq(events.id, id)).returning();
  return row ? eventFromRow(row) : null;
}

export async function deleteEvent(id: string): Promise<void> {
  const db = getDb();
  await db.delete(events).where(eq(events.id, id));
}

// Split published events into upcoming vs past (kept out of the RSC body to stay lint-pure).
export function splitEventsByTime(list: CommunityEvent[]) {
  const now = Date.now();
  const upcoming = list.filter((event) => new Date(event.ends_at ?? event.starts_at).getTime() >= now);
  const past = list.filter((event) => new Date(event.ends_at ?? event.starts_at).getTime() < now).reverse();
  return { upcoming, past };
}

export async function setRsvp(eventId: string, memberId: string, status: RsvpStatus): Promise<void> {
  const db = getDb();
  await db
    .insert(eventRsvps)
    .values({ eventId, memberId, status })
    .onConflictDoUpdate({ target: [eventRsvps.eventId, eventRsvps.memberId], set: { status } });
}
