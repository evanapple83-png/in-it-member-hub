"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { sinceLabel } from "@/components/admin/format";
import { Avatar } from "@/components/app/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { Pills } from "@/components/app/Pills";
import { useToast } from "@/components/app/Toast";
import { Layer, popStyle } from "@/components/app/shell/Layer";
import { MenuItem } from "@/components/app/shell/MenuItem";
import { Icon } from "@/components/ui/icon";
import type { AdminMemberRow } from "@/lib/admin-data";
import type { Member, VisibilityStatus } from "@/lib/types";
import { splitTags } from "@/lib/utils";

const STATUS: Record<VisibilityStatus, { cls: string; label: string }> = {
  approved: { cls: "ok", label: "Goedgekeurd" },
  pending: { cls: "wait", label: "Wacht op goedkeuring" },
  rejected: { cls: "no", label: "Afgewezen" },
  hidden: { cls: "off", label: "Verborgen" },
  deactivated: { cls: "off", label: "Gedeactiveerd" },
};

type Filter = "all" | "approved" | "pending" | "other";

function roleLabel(member: AdminMemberRow) {
  if (member.is_admin) return "Beheerder";
  return member.member_type === "friend" ? "Vriend" : "Lid";
}

// Leden: one table with a Beheren menu per row (goedkeuren, afwijzen, verbergen,
// deactiveren, bewerken, verwijderen). Rows that change rise in again.
export function MemberManagementTable({ members }: { members: AdminMemberRow[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(members);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; mode: "pop" | "sheet"; style?: CSSProperties } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<AdminMemberRow | null>(null);
  const closeMenu = useCallback(() => {
    setMenu(null);
    setConfirmDelete(false);
  }, []);

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => setFresh(null), 600);
    return () => window.clearTimeout(timer);
  }, [fresh]);

  const counts = useMemo(
    () => ({
      all: items.length,
      approved: items.filter((m) => m.visibility_status === "approved").length,
      pending: items.filter((m) => m.visibility_status === "pending").length,
      other: items.filter((m) => !["approved", "pending"].includes(m.visibility_status)).length,
    }),
    [items],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((m) => {
      if (filter === "approved" && m.visibility_status !== "approved") return false;
      if (filter === "pending" && m.visibility_status !== "pending") return false;
      if (filter === "other" && ["approved", "pending"].includes(m.visibility_status)) return false;
      if (!q) return true;
      return [m.full_name, m.email, m.role, m.company, m.location].some((v) => v?.toLowerCase().includes(q));
    });
  }, [items, query, filter]);

  async function update(id: string, action: "delete" | "patch", body?: Record<string, unknown>, done?: string) {
    setError(null);
    const response = await fetch(`/api/admin/members/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: action === "delete" ? undefined : JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(result.error ?? "Dat lukte niet. Probeer het opnieuw.");
      return false;
    }
    if (action === "delete") setItems((current) => current.filter((item) => item.id !== id));
    if (result.member) {
      setItems((current) => current.map((item) => (item.id === id ? { ...result.member, is_admin: item.is_admin } : item)));
      setFresh(id);
    }
    if (done) toast(done);
    router.refresh();
    return true;
  }

  function openMenu(id: string, trigger: HTMLElement) {
    const frame = trigger.closest<HTMLElement>(".screen");
    const narrow = (frame?.offsetWidth ?? 1000) <= 700;
    setConfirmDelete(false);
    setMenu(narrow ? { id, mode: "sheet" } : { id, mode: "pop", style: popStyle(trigger, frame) });
  }

  const target = menu ? items.find((m) => m.id === menu.id) ?? null : null;

  function act(status: VisibilityStatus, done: string) {
    if (!target) return;
    const id = target.id;
    closeMenu();
    void update(id, "patch", { visibility_status: status }, done);
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <Pills
          label="Filter leden"
          active={filter}
          onChange={(key) => setFilter(key as Filter)}
          items={[
            { key: "all", label: "Iedereen", count: counts.all },
            { key: "approved", label: "Goedgekeurd", count: counts.approved },
            { key: "pending", label: "Wacht", count: counts.pending },
            { key: "other", label: "Overig", count: counts.other },
          ]}
        />
        <label className="field">
          <Icon name="search" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Zoek op naam, e-mail of bedrijf"
            aria-label="Zoek een lid"
            type="search"
          />
        </label>
      </div>

      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 14 }}>
          {error}
        </p>
      ) : null}

      <Panel>
        {visible.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Lid</th>
                  <th>Rol</th>
                  <th>Status</th>
                  <th>Sinds</th>
                  <th>
                    <span className="sr-only-x">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((m) => (
                  <tr key={m.id} className={fresh === m.id ? "fresh" : undefined}>
                    <td>
                      <span className="who2">
                        <Avatar name={m.full_name} photoUrl={m.photo_url} id={m.id} size="sm" />
                        <span style={{ minWidth: 0 }}>
                          <b>{m.full_name}</b>
                          <small>{m.email}</small>
                        </span>
                      </span>
                    </td>
                    <td>{roleLabel(m)}</td>
                    <td>
                      <span className={`st ${STATUS[m.visibility_status]?.cls ?? "off"}`}>
                        {STATUS[m.visibility_status]?.label ?? m.visibility_status}
                      </span>
                    </td>
                    <td className="num">{sinceLabel(m.created_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="link"
                        type="button"
                        aria-haspopup="dialog"
                        onClick={(e) => openMenu(m.id, e.currentTarget)}
                        aria-label={`Beheren: ${m.full_name}`}
                      >
                        Beheren
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact icon="users" text={items.length ? "Geen leden gevonden met deze filter." : "Nog geen leden."} />
        )}
      </Panel>

      <Layer
        open={Boolean(menu)}
        kind={menu?.mode === "sheet" ? "sheet" : "pop"}
        style={menu?.style}
        onClose={closeMenu}
        label={target ? `Beheren: ${target.full_name}` : "Beheren"}
      >
        {target ? (
          <>
            <MenuItem icon="user" title="Profiel bekijken" hint="Zoals andere leden het zien" href={`/members/${target.id}`} onClick={closeMenu} />
            <MenuItem
              icon="pen"
              title="Bewerken"
              hint="Gegevens, type en toestemming"
              onClick={() => {
                setEditing(target);
                closeMenu();
              }}
            />
            {target.visibility_status !== "approved" ? (
              <MenuItem icon="check" title="Goedkeuren" hint="Krijgt toegang tot de community" onClick={() => act("approved", `${target.full_name} is goedgekeurd`)} />
            ) : null}
            {target.visibility_status !== "rejected" && target.visibility_status !== "deactivated" ? (
              <MenuItem icon="x" title="Afwijzen" hint="Ziet dit bij de volgende controle" onClick={() => act("rejected", `${target.full_name} afgewezen`)} />
            ) : null}
            {target.visibility_status !== "hidden" ? (
              <MenuItem icon="lock" title="Verbergen" hint="Niet zichtbaar in de ledenlijst" onClick={() => act("hidden", `${target.full_name} is verborgen`)} />
            ) : null}
            {target.visibility_status === "deactivated" ? (
              <MenuItem icon="shield" title="Heractiveren" hint="Krijgt weer toegang" onClick={() => act("approved", `${target.full_name} is weer actief`)} />
            ) : (
              <MenuItem icon="shield" title="Deactiveren" hint="Direct geen toegang meer" onClick={() => act("deactivated", `${target.full_name} is gedeactiveerd`)} />
            )}
            <button
              type="button"
              className="mi danger"
              onClick={() => {
                if (!confirmDelete) {
                  setConfirmDelete(true);
                  return;
                }
                const { id, full_name } = target;
                closeMenu();
                void update(id, "delete", undefined, `${full_name} verwijderd`);
              }}
            >
              <span className="ic">
                <Icon name="x" />
              </span>
              <span>
                <b>{confirmDelete ? "Klik nogmaals om te verwijderen" : "Verwijderen"}</b>
                <small>{confirmDelete ? "Dit kan niet ongedaan worden gemaakt" : "Haalt het lid volledig weg"}</small>
              </span>
            </button>
          </>
        ) : null}
      </Layer>

      <EditMemberModal
        member={editing}
        onClose={() => setEditing(null)}
        onSave={async (payload) => {
          if (!editing) return;
          const ok = await update(editing.id, "patch", payload, "Wijzigingen opgeslagen");
          if (ok) setEditing(null);
        }}
      />
    </>
  );
}

type Draft = {
  full_name: string;
  email: string;
  linkedin_url: string;
  photo_url: string;
  headline: string;
  role: string;
  company: string;
  location: string;
  about: string;
  skills: string;
  can_help_with: string;
  looking_for: string;
  languages: string;
  visibility_status: VisibilityStatus;
  member_type: Member["member_type"];
  consent_given: boolean;
  open_to_mentor: boolean;
  open_to_opportunities: boolean;
  open_to_collaborate: boolean;
  open_to_speaking: boolean;
};

function draftFor(member: Member): Draft {
  return {
    full_name: member.full_name,
    email: member.email,
    linkedin_url: member.linkedin_url ?? "",
    photo_url: member.photo_url ?? "",
    headline: member.headline ?? "",
    role: member.role ?? "",
    company: member.company ?? "",
    location: member.location ?? "",
    about: member.about ?? "",
    skills: member.skills.join(", "),
    can_help_with: member.can_help_with.join(", "),
    looking_for: member.looking_for.join(", "),
    languages: member.languages.join(", "),
    visibility_status: member.visibility_status,
    member_type: member.member_type,
    consent_given: member.consent_given,
    open_to_mentor: member.open_to_mentor,
    open_to_opportunities: member.open_to_opportunities,
    open_to_collaborate: member.open_to_collaborate,
    open_to_speaking: member.open_to_speaking,
  };
}

function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: Member | null;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftFor_, setDraftFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset the draft whenever another member is opened.
  if (member && draftFor_ !== member.id) {
    setDraftFor(member.id);
    setDraft(draftFor(member));
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    await onSave({
      ...draft,
      skills: splitTags(draft.skills),
      can_help_with: splitTags(draft.can_help_with),
      looking_for: splitTags(draft.looking_for),
      languages: splitTags(draft.languages),
    });
    setSaving(false);
  }

  const text = (key: keyof Draft, label: string, wide = false) => (
    <label style={wide ? { gridColumn: "1 / -1" } : undefined}>
      {label}
      <input value={String(draft?.[key] ?? "")} onChange={(e) => set(key, e.target.value as never)} />
    </label>
  );

  return (
    <Layer
      open={Boolean(member)}
      kind="modal"
      onClose={() => {
        onClose();
        setDraftFor(null);
      }}
      label={member ? `${member.full_name} bewerken` : "Lid bewerken"}
      style={{ width: "min(720px, calc(100% - 28px))", maxHeight: "calc(100% - 40px)", overflowY: "auto" }}
    >
      {draft && member ? (
        <>
          <h3>{member.full_name} bewerken</h3>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {text("full_name", "Naam")}
            {text("email", "E-mail")}
            {text("linkedin_url", "LinkedIn-profiel")}
            {text("photo_url", "Foto (link)")}
            {text("headline", "Kopregel", true)}
            {text("role", "Rol")}
            {text("company", "Bedrijf")}
            {text("location", "Plaats")}
            <label>
              Status
              <select value={draft.visibility_status} onChange={(e) => set("visibility_status", e.target.value as VisibilityStatus)}>
                {(Object.keys(STATUS) as VisibilityStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS[s].label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select value={draft.member_type} onChange={(e) => set("member_type", e.target.value as Member["member_type"])}>
                <option value="member">Lid</option>
                <option value="friend">Vriend van IN-IT</option>
              </select>
            </label>
            <label style={{ gridColumn: "1 / -1" }}>
              Over
              <textarea value={draft.about} onChange={(e) => set("about", e.target.value)} />
            </label>
            {text("skills", "Vaardigheden (met komma's)")}
            {text("can_help_with", "Kan helpen met")}
            {text("looking_for", "Zoekt")}
            {text("languages", "Talen")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(
              [
                ["consent_given", "Toestemming gegeven"],
                ["open_to_mentor", "Mentor"],
                ["open_to_opportunities", "Open voor werk"],
                ["open_to_collaborate", "Samenwerken"],
                ["open_to_speaking", "Spreker"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 12, background: "var(--canvas)" }}>
                <input type="checkbox" checked={draft[key]} onChange={(e) => set(key, e.target.checked)} />
                {label}
              </label>
            ))}
          </div>
          <div className="row">
            <button className="btn ghost" type="button" onClick={onClose}>
              Annuleren
            </button>
            <button className="btn primary" type="button" onClick={save} disabled={saving}>
              {saving ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </>
      ) : null}
    </Layer>
  );
}
