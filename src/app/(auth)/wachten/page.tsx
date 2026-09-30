import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Cover } from "@/components/app/Cover";
import { SignOutButton } from "@/components/access/SignOutButton";
import { WaitStatus } from "@/components/access/WaitStatus";
import { Icon } from "@/components/ui/icon";
import { getDb, hasDatabase } from "@/db";
import { invites, linkedinAccounts } from "@/db/schema";
import { getAccessState, homeForState } from "@/lib/access-state";
import { PRIVACY_CONTACT_EMAIL } from "@/lib/site";

export const metadata = { title: "Je aanvraag | IN-IT" };
export const dynamic = "force-dynamic";

// Only same-site paths are echoed back ("Je probeerde /leden te openen").
function safePath(raw: string | undefined) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.length > 200) return null;
  if (raw === "/wachten") return null;
  return raw;
}

function formatDay(d: Date) {
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" }).format(d);
}

function Contact() {
  return (
    <p className="sub">
      Denk je dat dit niet klopt? Mail de coördinator op{" "}
      <b style={{ userSelect: "all", color: "var(--ink)" }}>{PRIVACY_CONTACT_EMAIL}</b>.
    </p>
  );
}

export default async function WachtenPage({ searchParams }: { searchParams: Promise<{ van?: string }> }) {
  const { state, member, userId } = await getAccessState();
  if (state === "anon" || state === "no-member" || state === "incomplete" || state === "approved" || !member) {
    redirect(homeForState(state));
  }

  if (state === "rejected" || state === "deactivated") {
    const rejected = state === "rejected";
    const reason = rejected ? member.rejectionReason?.trim() : null;
    return (
      <div className="screen wait enter">
        <div className="wcard">
          <Cover crop="c-canal" />
          <div className="wb">
            <div>
              <h1>{rejected ? "Je aanvraag is niet goedgekeurd" : "Je account is gepauzeerd"}</h1>
              <p className="sub" style={{ marginTop: 6 }}>
                {rejected
                  ? "De coördinator heeft je aanvraag bekeken en kan je nu geen toegang geven."
                  : "Een coördinator heeft je account tijdelijk uitgezet. Je profiel is nu niet zichtbaar voor andere leden."}
              </p>
            </div>
            {reason ? (
              <div className="note">
                <Icon name="info" />
                <span>
                  <b>Toelichting:</b> {reason}
                </span>
              </div>
            ) : null}
            <Contact />
            <div className="wcta">
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pending: gather the real steps for the timeline.
  let linkedinName: string | null = null;
  let usedAt: Date | null = null;
  if (hasDatabase() && userId) {
    const db = getDb();
    const [[account], [invite]] = await Promise.all([
      db.select({ name: linkedinAccounts.linkedinName }).from(linkedinAccounts).where(eq(linkedinAccounts.userId, userId)).limit(1),
      db.select({ usedAt: invites.usedAt }).from(invites).where(eq(invites.usedByUserId, userId)).orderBy(desc(invites.usedAt)).limit(1),
    ]);
    linkedinName = account?.name ?? null;
    usedAt = invite?.usedAt ?? null;
  }

  const name = member.fullName?.trim() || linkedinName || "";
  const { van } = await searchParams;
  return (
    <WaitStatus
      info={{
        firstName: name.split(/\s+/)[0] || "nieuw lid",
        linkedinName: linkedinName || name || "Gekoppeld",
        profileLine: [member.role, member.location].filter(Boolean).join(", ") || "Ingevuld",
        codeLine: usedAt ? `Gebruikt op ${formatDay(usedAt)}` : "Gebruikt",
        triedPath: safePath(van),
      }}
    />
  );
}
