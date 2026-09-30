import Link from "next/link";
import { Avatar } from "@/components/app/Avatar";
import { Cover, cropFor } from "@/components/app/Cover";
import { DateTile } from "@/components/app/DateTile";
import { CoverLink } from "@/components/app/community/CoverLink";
import { JoinButton } from "@/components/app/community/JoinButton";
import { Icon } from "@/components/ui/icon";
import type { Community } from "@/lib/communities";
import { capitalize, excerpt, groupCategory, plural, shortDate, time } from "@/lib/format-nl";
import type { BlogPost, CommunityEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

// Presentational building blocks shared by Vandaag, Groepen, Agenda and Verhalen.

const isOnline = (event: CommunityEvent) => Boolean(event.meet_link) && !event.location;

function EventCover({ event }: { event: CommunityEvent }) {
  return <Cover crop={cropFor(event.slug)} src={event.cover_image_url} />;
}

function GoingChip() {
  return (
    <span className="chip soft ok">
      <Icon name="check" />
      Je gaat
    </span>
  );
}

export function EventRow({ event, compact = false }: { event: CommunityEvent; compact?: boolean }) {
  const going = event.my_rsvp === "going";
  const place = event.location || (event.meet_link ? "Online" : null);
  return (
    <Link href={`/agenda/${event.slug}`} className="erow">
      <DateTile date={event.starts_at} accent={going} />
      <span className="t">
        <b>{event.title}</b>
        <small>
          {place ? <Icon name={isOnline(event) ? "video" : "pin"} /> : <Icon name="clock" />}
          {place ? `${place} · ` : ""}
          {time(event.starts_at)}
        </small>
      </span>
      {compact ? null : going ? <GoingChip /> : <span className="chip">{capitalize(event.category)}</span>}
    </Link>
  );
}

export function FeatureEvent({ event, kicker }: { event: CommunityEvent; kicker: string }) {
  const place = event.location || (event.meet_link ? "Online" : null);
  return (
    <CoverLink href={`/agenda/${event.slug}`} className="panel flush feature">
      <div data-cover>
        <EventCover event={event} />
      </div>
      <div className="fb">
        <span className="kick">
          <Icon name="cal" />
          {kicker}
        </span>
        <h2>{event.title}</h2>
        {event.description ? <p className="desc">{event.description}</p> : null}
        <div className="row">
          <span className="chip soft">
            <Icon name="clock" />
            {shortDate(event.starts_at)}, {time(event.starts_at)}
          </span>
          {place ? (
            <span className="chip soft">
              <Icon name={isOnline(event) ? "video" : "pin"} />
              {place}
            </span>
          ) : null}
        </div>
      </div>
    </CoverLink>
  );
}

export function EventTile({ event }: { event: CommunityEvent }) {
  const going = event.rsvp_counts?.going ?? 0;
  return (
    <article className="tile">
      <CoverLink href={`/agenda/${event.slug}`} className="tl">
        <div data-cover>
          <EventCover event={event} />
        </div>
        <div className="body" style={{ gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "start" }}>
          <DateTile date={event.starts_at} accent={event.my_rsvp === "going"} />
          <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
            <h4>{event.title}</h4>
            <p className="muted" style={{ fontSize: 13 }}>
              {[event.location || (event.meet_link ? "Online" : null), time(event.starts_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
      </CoverLink>
      <div className="foot">
        <span className="chip soft">
          <Icon name="users" />
          <span className="num">{going ? `${going} ${going === 1 ? "gaat" : "gaan"}` : "Wees de eerste"}</span>
        </span>
        <span style={{ flex: 1 }} />
        {event.my_rsvp === "going" ? <GoingChip /> : <span className="chip tag">{capitalize(event.category)}</span>}
      </div>
    </article>
  );
}

export function GroupTile({
  community,
  count,
  joined,
  wide = false,
}: {
  community: Community;
  count: number;
  joined: boolean;
  wide?: boolean;
}) {
  return (
    <article className={cn("tile", wide && "wide")}>
      <CoverLink href={`/communities/${community.slug}`} className="tl">
        <div data-cover>
          <Cover crop={cropFor(community.slug)} src={community.cover_image_url} />
        </div>
        <div className="body">
          <h4>{community.name}</h4>
          {community.description ? <p className="desc">{community.description}</p> : null}
        </div>
      </CoverLink>
      <div className="foot">
        <span className="chip soft">
          <Icon name="users" />
          <span className="num">{count ? plural(count, "lid", "leden") : "Nog geen leden"}</span>
        </span>
        <span className="chip tag">{groupCategory(community.category)}</span>
        <span style={{ flex: 1 }} />
        <JoinButton slug={community.slug} name={community.name} joined={joined} />
      </div>
    </article>
  );
}

export function FeatureStory({ post, kicker }: { post: BlogPost; kicker: string }) {
  return (
    <CoverLink href={`/blog/${post.slug}`} className="panel flush feature">
      <div data-cover>
        <Cover crop={cropFor(post.slug)} src={post.cover_image_url} />
      </div>
      <div className="fb">
        <span className="kick">
          <Icon name="book" />
          {kicker}
        </span>
        <h2>{post.title}</h2>
        <p className="desc">{excerpt(post.body, 240)}</p>
        <div className="row">
          <Avatar name={post.author_name} photoUrl={post.author_photo} id={post.author_id ?? undefined} size="sm" />
          <small className="muted">{post.author_name}</small>
        </div>
      </div>
    </CoverLink>
  );
}

export function StoryTile({ post }: { post: BlogPost }) {
  return (
    <article className="tile" style={post.status === "hidden" ? { opacity: 0.6 } : undefined}>
      <CoverLink href={`/blog/${post.slug}`} className="tl">
        <div data-cover>
          <Cover crop={cropFor(post.slug)} src={post.cover_image_url} />
        </div>
        <div className="body">
          <h4>{post.title}</h4>
          <p className="desc">{excerpt(post.body, 180)}</p>
        </div>
      </CoverLink>
      <div className="foot">
        <Avatar name={post.author_name} photoUrl={post.author_photo} id={post.author_id ?? undefined} size="xs" />
        <small className="muted">
          {post.author_name}
          {post.status === "hidden" ? " · verborgen" : ""}
        </small>
      </div>
    </article>
  );
}

// Back button + cover for detail headers (`.ghead`). The cover takes over from the card.
export function HeaderCover({ crop, src, back, backLabel }: { crop: string; src?: string | null; back: string; backLabel: string }) {
  return (
    <>
      <div data-hero style={{ viewTransitionName: "hero-cover" }}>
        <Cover crop={cropFor(crop)} src={src} />
      </div>
      <Link className="icon-btn back" href={back} aria-label={backLabel}>
        <Icon name="back" />
      </Link>
    </>
  );
}
