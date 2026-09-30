import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/app/Avatar";
import { Panel } from "@/components/app/Panel";
import { PrivacyControls } from "@/components/profile/PrivacyControls";
import { Icon } from "@/components/ui/icon";
import { getApprovedCurrentMember } from "@/lib/access";
import { isProfileComplete } from "@/lib/hub";
import { PUBLIC_FIELD_OPTIONS } from "@/lib/member-utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Instellingen | IN-IT" };

export default async function ProfilePage() {
  const member = await getApprovedCurrentMember();
  if (!member) redirect("/join?locked=profile");

  const complete = isProfileComplete(member);
  const checks = [
    { label: "Foto", done: Boolean(member.photo_url) },
    { label: "Rol of headline", done: Boolean(member.role || member.headline) },
    { label: "Over jou", done: Boolean(member.about?.trim()) },
    { label: "Vaardigheden", done: member.skills.length > 0 },
    { label: "Waar je mee kunt helpen", done: member.can_help_with.length > 0 },
    { label: "LinkedIn", done: Boolean(member.linkedin_url) },
  ];
  const openTo = [
    member.open_to_mentor && "Mentor",
    member.open_to_opportunities && "Open voor kansen",
    member.open_to_speaking && "Spreker",
    member.open_to_collaborate && "Samenwerken",
  ].filter(Boolean) as string[];
  const shared = PUBLIC_FIELD_OPTIONS.filter((option) => member.public_fields.includes(option.key)).map((option) => option.label);

  return (
    <div className="page" data-reveal-group>
      <div className="hello" data-reveal>
        <div>
          <h1>Instellingen</h1>
          <p>Je profiel, wat je deelt en wat IN-IT van je bewaart.</p>
        </div>
        <div className="acts">
          <Link className="btn ghost" href={`/members/${member.id}`}>
            Bekijk je profiel
          </Link>
          <Link className="btn primary" href="/onboarding" data-press>
            <Icon name="pen" />
            Profiel bewerken
          </Link>
        </div>
      </div>

      <div className="cols">
        <div className="stack">
          <Panel reveal title="Je profiel">
            <div className="person" style={{ background: "none", padding: 0 }}>
              <Avatar name={member.full_name} photoUrl={member.photo_url} id={member.id} size="lg" />
              <span className="t">
                <b style={{ fontSize: 16 }}>{member.full_name}</b>
                <small>{[member.role || member.headline, member.company, member.location].filter(Boolean).join(" · ") || "Nog geen rol ingevuld"}</small>
              </span>
            </div>
            <div className="steps" style={{ marginTop: 16 }}>
              {checks.map((check) => (
                <Link key={check.label} href="/onboarding" className={cn("step", check.done && "done")}>
                  <span className="ck">
                    <Icon name="check" />
                  </span>
                  {check.label}
                </Link>
              ))}
            </div>
            <p className="muted" style={{ fontSize: 14, marginTop: 14 }}>
              {complete
                ? "Je profiel is compleet. Leden kunnen je vinden op rol en vaardigheden."
                : "Vul je rol, iets over jezelf en je vaardigheden in, dan vinden leden je makkelijker."}
            </p>
          </Panel>

          <PrivacyControls initialEmailOptOut={member.email_opt_out} />
        </div>

        <aside className="stack aside">
          <Panel reveal title="Je staat open voor">
            {openTo.length ? (
              <div className="chips">
                {openTo.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>
                Nog niets aangezet. Geef aan of je wilt mentoren, spreken of openstaat voor kansen.
              </p>
            )}
          </Panel>
          <Panel reveal title="Zichtbaar buiten IN-IT">
            {shared.length ? (
              <>
                <p className="muted" style={{ fontSize: 14, marginBottom: 10 }}>
                  Je openbare profielpagina toont je naam en:
                </p>
                <div className="chips">
                  {shared.map((item) => (
                    <span key={item} className="chip tag">
                      {item}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="muted" style={{ fontSize: 14 }}>
                Alleen ingelogde leden zien je profiel. Je kunt dit aanpassen bij Profiel bewerken.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
