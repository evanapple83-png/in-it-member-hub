import { redirect } from "next/navigation";
import { EmptyState } from "@/components/app/EmptyState";
import { GroupTile } from "@/components/app/community/cards";
import { TabbedPanels } from "@/components/app/community/TabbedPanels";
import { getApprovedCurrentMember } from "@/lib/access";
import { getCommunities } from "@/lib/communities";
import { getCommunityCounts, getJoinedCommunityIds } from "@/lib/hub";

export const metadata = { title: "Groepen | IN-IT" };

export default async function CommunitiesPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=communities");

  const [groups, counts, joinedIds] = await Promise.all([getCommunities(), getCommunityCounts(), getJoinedCommunityIds(member.id)]);
  const joined = new Set(joinedIds);
  const mine = groups.filter((group) => joined.has(group.id));

  const all = groups.length ? (
    <div className="tiles">
      {groups.map((group, index) => (
        <GroupTile key={group.id} community={group} count={counts[group.id] ?? 0} joined={joined.has(group.id)} wide={index === 0} />
      ))}
    </div>
  ) : (
    <div className="panel">
      <EmptyState icon="groups" title="Nog geen groepen" text="De coördinator zet de eerste groepen klaar. Je ziet ze hier zodra ze er zijn." />
    </div>
  );

  const my = mine.length ? (
    <div className="tiles">
      {mine.map((group) => (
        <GroupTile key={group.id} community={group} count={counts[group.id] ?? 0} joined />
      ))}
    </div>
  ) : (
    <div className="panel">
      <EmptyState
        icon="groups"
        title="Je bent nog nergens lid"
        text="Groepen zijn de plek voor gesprekken met vakgenoten. Kies er een onder Alle groepen om mee te beginnen."
      />
    </div>
  );

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Groepen</h1>
          <p>Vakgroepen en sociale plekken binnen IN-IT.</p>
        </div>
      </div>
      <TabbedPanels
        label="Welke groepen"
        tabs={[
          { key: "alle", label: "Alle groepen", count: groups.length, content: all },
          { key: "mijn", label: "Mijn groepen", count: mine.length, content: my },
        ]}
      />
    </div>
  );
}
