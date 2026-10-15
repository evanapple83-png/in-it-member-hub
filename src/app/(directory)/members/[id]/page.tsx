import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicMemberProfile } from "@/components/members/PublicMemberProfile";
import { Avatar } from "@/components/app/Avatar";
import { Cover } from "@/components/app/Cover";
import { EmptyState } from "@/components/app/EmptyState";
import { EventRow, GroupTile } from "@/components/app/community/cards";
import { TabbedPanels } from "@/components/app/community/TabbedPanels";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCommunities } from "@/lib/communities";
import { listPublishedEvents } from "@/lib/events";
import { getCommunityCounts, getGoingEventIds, getJoinedCommunityIds, getStoryCount, upcomingEvents } from "@/lib/hub";
import { getPublicMember, getPublicProfile } from "@/lib/members";
import { getCurrentAdminRole } from "@/lib/admin-auth";
import { adminCan } from "@/lib/roles";
import { getMemberCv } from "@/lib/member-cvs";

export const metadata = { title: "Profiel | IN-IT" };

function Chips({ items }: { items: string[] }) {
  return (
    <span className="chips">
      {items.map((item) => (
        <span key={item} className="chip soft">
          {item}
        </span>
      ))}
    </span>
  );
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getApprovedCurrentMember();
  const { id } = await params;
  if (!viewer) {
    const profile = await getPublicProfile(id);
    if (!profile) notFound();
    return <PublicMemberProfile member={profile} />;
  }
  const member = await getPublicMember(id);
  if (!member) notFound();
  const own = member.id === viewer.id;
  const canReadCv = own || adminCan(await getCurrentAdminRole(), "manage_users");
  const cv = canReadCv ? await getMemberCv(member.id) : null;

  const [groups, counts, joinedIds, viewerJoined, goingIds, events, stories] = await Promise.all([
    getCommunities(),
    getCommunityCounts(),
    getJoinedCommunityIds(member.id),
    getJoinedCommunityIds(viewer.id),
    getGoingEventIds(member.id),
    listPublishedEvents(viewer.id),
    getStoryCount(member.id),
  ]);
  const theirGroups = groups.filter((group) => joinedIds.includes(group.id));
  const theirEvents = upcomingEvents(events).filter((event) => goingIds.includes(event.id));
  const first = member.full_name.split(" ")[0];

  const badges = [
    member.open_to_mentor && "Mentor",
    member.open_to_opportunities && "Open voor kansen",
    member.open_to_speaking && "Spreker",
    member.open_to_collaborate && "Samenwerken",
  ].filter(Boolean) as string[];

  const facts: [string, ReactNode][] = [];
  if (member.role) facts.push(["Rol", member.role]);
  if (member.company) facts.push(["Bedrijf", member.company]);
  if (member.location) facts.push(["Woonplaats", member.location]);
  if (member.can_help_with.length) facts.push(["Kan helpen met", <Chips key="h" items={member.can_help_with} />]);
  if (member.skills.length) facts.push(["Vaardigheden", <Chips key="s" items={member.skills} />]);
  if (member.looking_for.length) facts.push(["Zoekt", <Chips key="l" items={member.looking_for} />]);
  if (member.languages.length) facts.push(["Talen", <Chips key="t" items={member.languages} />]);

  const about =
    member.about || facts.length ? (
      <section className="panel about">
        {member.about ? <p className="prose" style={{ whiteSpace: "pre-line" }}>{member.about}</p> : null}
        {facts.length ? (
          <dl className="kv">
            {facts.map(([label, value]) => (
              <div key={label} style={{ display: "contents" }}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>
    ) : (
      <div className="panel">
        <EmptyState
          icon="user"
          title={own ? "Vertel iets over jezelf" : "Nog niets ingevuld"}
          text={own ? "Vul je rol, vaardigheden en waar je mee kunt helpen in, dan vinden leden je makkelijker." : `${first} heeft het profiel nog niet ingevuld.`}
          action={
            own ? (
              <Link className="btn primary" href="/onboarding" data-press>
                Profiel aanvullen
              </Link>
            ) : undefined
          }
        />
      </div>
    );

  const groupsBody = theirGroups.length ? (
    <div className="tiles">
      {theirGroups.map((group) => (
        <GroupTile key={group.id} community={group} count={counts[group.id] ?? 0} joined={viewerJoined.includes(group.id)} />
      ))}
    </div>
  ) : (
    <div className="panel">
      <EmptyState
        icon="groups"
        title="Nog geen groepen"
        text={own ? "Word lid van een groep en hij verschijnt hier." : `${first} is nog geen lid van een groep.`}
        action={
          own ? (
            <Link className="btn primary" href="/communities" data-press>
              Groepen bekijken
            </Link>
          ) : undefined
        }
      />
    </div>
  );

  const eventsBody = theirEvents.length ? (
    <section className="panel">
      <div className="rows">
        {theirEvents.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </section>
  ) : (
    <div className="panel">
      <EmptyState
        icon="cal"
        title="Geen aanmeldingen"
        text={own ? "Meld je aan voor een activiteit en die verschijnt hier." : `${first} heeft zich nog nergens voor aangemeld.`}
      />
    </div>
  );

  const subtitle = [member.role || member.headline, member.location].filter(Boolean).join(", ");

  return (
    <div className="page" data-reveal-group>
      <section className="panel prof" data-reveal>
        <Cover crop="c-wide" style={{ position: "relative" }}>
          <div className="stats">
            <div>
              <b className="num">{theirGroups.length}</b>
              <small>{theirGroups.length === 1 ? "groep" : "groepen"}</small>
            </div>
            <div>
              <b className="num">{theirEvents.length}</b>
              <small>{theirEvents.length === 1 ? "activiteit" : "activiteiten"}</small>
            </div>
            <div>
              <b className="num">{stories}</b>
              <small>{stories === 1 ? "verhaal" : "verhalen"}</small>
            </div>
          </div>
        </Cover>
        <div className="row">
          <div className="left">
            {own ? (
              <Link className="btn ghost" href="/profile">
                <Icon name="pen" />
                Profiel bewerken
              </Link>
            ) : member.linkedin_url ? (
              <a className="btn ghost" href={member.linkedin_url} target="_blank" rel="noreferrer">
                <Icon name="users" />
                Verbinden
              </a>
            ) : null}
          </div>
          <div className="center">
            <Avatar name={member.full_name} photoUrl={member.photo_url} id={member.id} />
            <h1 style={{ fontSize: 22, marginTop: 10 }}>{member.full_name}</h1>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <div className="right">
            {member.linkedin_url ? (
              <a className="icon-btn" href={member.linkedin_url} target="_blank" rel="noreferrer" aria-label={`LinkedIn van ${first}`}>
                <span className="in">in</span>
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {cv ? (
        <section className="panel">
          <h2>Cv</h2>
          <a className="btn ghost" href={`/api/members/${member.id}/cv`}>Cv downloaden (PDF)</a>
        </section>
      ) : null}
      <TabbedPanels
        label="Profielonderdelen"
        tabs={[
          { key: "over", label: "Over", content: about },
          { key: "groepen", label: "Groepen", count: theirGroups.length, content: groupsBody },
          { key: "activiteit", label: "Activiteiten", count: theirEvents.length, content: eventsBody },
        ]}
        aside={
          badges.length ? (
            <div className="chips">
              {badges.map((badge) => (
                <span key={badge} className="chip">
                  {badge}
                </span>
              ))}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
