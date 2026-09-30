import { redirect } from "next/navigation";
import { AgendaView } from "@/components/app/community/AgendaView";
import { getApprovedCurrentMember } from "@/lib/access";
import { listPublishedEvents, splitEventsByTime } from "@/lib/events";

export const metadata = { title: "Agenda | IN-IT" };

export default async function AgendaPage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=agenda");

  const { upcoming, past } = splitEventsByTime(await listPublishedEvents(member.id));

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Agenda</h1>
          <p>Wat er de komende weken gebeurt. Meld je aan met één klik.</p>
        </div>
      </div>
      <AgendaView upcoming={upcoming} past={past} />
    </div>
  );
}
