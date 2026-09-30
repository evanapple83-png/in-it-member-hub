import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/app/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { EventRow, FeatureEvent, FeatureStory, GroupTile } from "@/components/app/community/cards";
import { WelcomeSteps } from "@/components/app/WelcomeSteps";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { getShowcasePost } from "@/lib/blog";
import { getCommunities } from "@/lib/communities";
import { listPublishedEvents } from "@/lib/events";
import { capitalize, greeting, relative, shortDate, weekdayDate } from "@/lib/format-nl";
import {
  getCommunityCounts,
  getJoinedCommunityIds,
  getRecentGroupPosts,
  hasAnyRsvp,
  isProfileComplete,
  upcomingEvents,
} from "@/lib/hub";
import { getPublicMembers } from "@/lib/members";

export const metadata = { title: "Vandaag | IN-IT" };

export default async function VandaagPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=members");

  const [events, showcase, groups, counts, joinedIds, groupPosts, people, rsvpd] = await Promise.all([
    listPublishedEvents(member.id),
    getShowcasePost(),
    getCommunities(),
    getCommunityCounts(),
    getJoinedCommunityIds(member.id),
    getRecentGroupPosts(member.id, 30, 3),
    getPublicMembers(),
    hasAnyRsvp(member.id),
  ]);

  const upcoming = upcomingEvents(events);
  const mine = upcoming.filter((event) => event.my_rsvp === "going");
  const next = upcoming[0] ?? null;
  const joined = new Set(joinedIds);
  const discover = groups.filter((group) => !joined.has(group.id)).slice(0, 2);
  const others = people.filter((person) => person.id !== member.id).slice(0, 4);

  const steps = [
    { key: "profile", label: "Profiel compleet", href: "/profile", done: isProfileComplete(member) },
    { key: "group", label: "Kies een groep", href: "/communities", done: joined.size > 0 },
    { key: "rsvp", label: "Meld je aan voor een activiteit", href: "/agenda", done: rsvpd },
  ];
  const done = steps.filter((step) => step.done).length;
  const first = member.full_name.split(" ")[0];

  return (
    <div className="page" data-reveal-group>
      <div className="hello" data-reveal>
        <div>
          <h1>
            {greeting()}, {first}
          </h1>
          <p>{capitalize(weekdayDate())}</p>
        </div>
      </div>

      {done < steps.length ? (
        <section className="panel welcome" data-reveal>
          <div className="l">
            <h3>Welkom bij IN-IT</h3>
            <p className="muted">Drie stappen en je bent helemaal binnen.</p>
          </div>
          <WelcomeSteps steps={steps} />
        </section>
      ) : null}

      <div className="cols">
        <div className="stack">
          {showcase ? (
            <FeatureStory post={showcase} kicker="Verhaal van de week" />
          ) : next ? (
            <FeatureEvent event={next} kicker={next.my_rsvp === "going" ? "Jij gaat" : "Volgende activiteit"} />
          ) : (
            <Panel reveal>
              <EmptyState
                icon="cal"
                title="Het is even rustig"
                text="Er staat nog niets op de agenda. Zodra er een activiteit gepland is, zie je die hier als eerste."
              />
            </Panel>
          )}

          {upcoming.length ? (
            <Panel
              reveal
              title="Binnenkort"
              count={upcoming.length}
              action={
                <Link className="link" href="/agenda">
                  Hele agenda
                </Link>
              }
            >
              <div className="rows">
                {upcoming.slice(0, 3).map((event) => (
                  <EventRow key={event.id} event={event} />
                ))}
              </div>
            </Panel>
          ) : null}

          {groupPosts.length ? (
            <Panel reveal title="Uit jouw groepen">
              <div className="rows">
                {groupPosts.map((post) => (
                  <Link key={post.id} href={`/communities/${post.community_slug}`} className="erow">
                    <Avatar name={post.author_name} photoUrl={post.author_photo} id={post.author_id ?? undefined} size="sm" />
                    <span className="t">
                      <b>{post.body}</b>
                      <small>
                        {post.author_name} in {post.community_name} · {relative(post.created_at)}
                      </small>
                    </span>
                    <Icon name="arrow" />
                  </Link>
                ))}
              </div>
            </Panel>
          ) : null}

          {discover.length ? (
            <section data-reveal>
              <div className="ph">
                <h3>Groepen om te ontdekken</h3>
                <Link className="link" href="/communities">
                  Alle groepen
                </Link>
              </div>
              <div className="tiles">
                {discover.map((group) => (
                  <GroupTile key={group.id} community={group} count={counts[group.id] ?? 0} joined={false} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="stack aside">
          {others.length ? (
            <Panel
              reveal
              title="Leer kennen"
              action={
                <Link className="link" href="/members">
                  Alle
                </Link>
              }
            >
              {others.map((person) => (
                <Link key={person.id} href={`/members/${person.id}`} className="person" data-hover="lift">
                  <Avatar name={person.full_name} photoUrl={person.photo_url} id={person.id} />
                  <span className="t">
                    <b>{person.full_name}</b>
                    {person.role || person.headline ? <small>{person.role || person.headline}</small> : null}
                  </span>
                  <span className="round" aria-hidden="true">
                    <Icon name="arrow" />
                  </span>
                </Link>
              ))}
            </Panel>
          ) : null}

          {upcoming.length ? (
            <Panel reveal title="Jouw aanmeldingen" count={mine.length || undefined}>
              {mine.length ? (
                <div className="rows">
                  {mine.map((event) => (
                    <EventRow key={event.id} event={event} compact />
                  ))}
                </div>
              ) : (
                <p className="muted" style={{ fontSize: 14 }}>
                  Nog nergens voor aangemeld. De eerstvolgende is{" "}
                  <Link href={`/agenda/${upcoming[0].slug}`} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
                    {upcoming[0].title}
                  </Link>{" "}
                  op {shortDate(upcoming[0].starts_at)}.
                </p>
              )}
            </Panel>
          ) : null}

          <section className="navycard" data-reveal>
            <h3>Ken je iemand voor IN-IT?</h3>
            <p>Draag een collega of vriend voor. De coördinator kijkt mee en stuurt een uitnodiging.</p>
            <Link className="btn" href="/request-access" data-press>
              Draag iemand voor
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
