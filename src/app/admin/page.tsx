import Link from "next/link";
import { ReviewQueue } from "@/components/admin/ReviewQueue";
import { agoLabel, untilLabel } from "@/components/admin/format";
import { Panel } from "@/components/app/Panel";
import { getAdminOverview } from "@/lib/admin-data";
import { requireAdminAccess } from "@/lib/access-state";

export default async function AdminOverviewPage() {
  // Every admin page checks for itself: the layout gate alone can be skipped on partial renders.
  await requireAdminAccess();
  const data = await getAdminOverview();
  const waiting = data.pendingMembers.length + data.openRequests.length;
  const now = data.generatedAt;

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Overzicht</h1>
          <p>Wat er op jou wacht.</p>
        </div>
      </div>

      <div className="kpis">
        <span className="kpi">
          <b className="num">{waiting}</b>wacht op goedkeuring
        </span>
        <span className="kpi">
          <b className="num">{data.activeCodeCount}</b>actieve codes
        </span>
        <span className="kpi">
          <b className="num">{data.memberCount}</b>leden
        </span>
      </div>

      <div className="cols">
        <div className="stack">
          <ReviewQueue pendingMembers={data.pendingMembers} openRequests={data.openRequests} variant="overview" />
        </div>
        <aside className="stack aside">
          <Panel
            title="Actieve codes"
            action={
              <Link className="link" href="/admin/invites">
                Alle
              </Link>
            }
          >
            {data.activeCodes.length ? (
              data.activeCodes.map((invite) => (
                <div className="person" key={invite.id}>
                  <span className="t">
                    <b className="code">INIT-••••••••</b>
                    <small>
                      {invite.email ?? invite.note ?? "Voor iedereen met de code"} · tot {untilLabel(invite.expires_at)}
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <p className="muted">Geen actieve codes.</p>
            )}
          </Panel>
          <Panel title="Recent">
            {data.recent.length ? (
              <div className="feed">
                {data.recent.map((item) => (
                  <div key={item.id}>
                    {item.text}
                    <small>{agoLabel(item.at, now)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>
                Nog niets gebeurd.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
