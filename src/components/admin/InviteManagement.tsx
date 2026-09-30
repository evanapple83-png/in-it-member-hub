"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { copyText, untilLabel } from "@/components/admin/format";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { useToast } from "@/components/app/Toast";
import { Layer } from "@/components/app/shell/Layer";
import { Icon } from "@/components/ui/icon";
import type { AdminInvite } from "@/lib/admin-data";

const STATUS: Record<string, { cls: string; label: string }> = {
  active: { cls: "ok", label: "Actief" },
  used: { cls: "off", label: "Gebruikt" },
  revoked: { cls: "off", label: "Ingetrokken" },
  expired: { cls: "off", label: "Verlopen" },
};

const MASK = "INIT-••••••••";

// Uitnodigingen: table of codes + "Nieuwe uitnodiging" modal. Only a hash of each code is
// stored, so the real code is visible once, right after it is made.
export function InviteManagement({ invites, openNew }: { invites: AdminInvite[]; openNew: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(invites);
  const [fresh, setFresh] = useState<string | null>(null);
  const [open, setOpen] = useState(openNew);
  const [seenOpenNew, setSeenOpenNew] = useState(openNew);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The topbar button links to ?new=1; open the modal each time that flag appears.
  if (openNew !== seenOpenNew) {
    setSeenOpenNew(openNew);
    if (openNew) setOpen(true);
  }

  useEffect(() => {
    if (openNew) router.replace("/admin/invites", { scroll: false });
  }, [openNew, router]);

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => setFresh(null), 600);
    return () => window.clearTimeout(timer);
  }, [fresh]);

  async function revoke(id: string) {
    setBusyId(id);
    setError(null);
    const response = await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "revoked" }),
    });
    setBusyId(null);
    if (!response.ok) {
      setError("Intrekken lukte niet. Probeer het opnieuw.");
      return;
    }
    setItems((current) => current.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)));
    setFresh(id);
    toast("Code ingetrokken");
    router.refresh();
  }

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Uitnodigingen</h1>
          <p>Codes zijn 24 uur geldig en werken één keer. Alleen voor de eerste aanmelding.</p>
        </div>
        <button className="btn primary" type="button" onClick={() => setOpen(true)}>
          <Icon name="plus" />
          Nieuwe uitnodiging
        </button>
      </div>

      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 14 }}>
          {error}
        </p>
      ) : null}

      <Panel>
        {items.length ? (
          <>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Geldig tot</th>
                    <th>Door</th>
                    <th>Notitie</th>
                    <th>
                      <span className="sr-only-x">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((invite) => {
                    const st = STATUS[invite.status] ?? { cls: "off", label: invite.status };
                    return (
                      <tr key={invite.id} className={fresh === invite.id ? "fresh" : undefined}>
                        <td className="code">{MASK}</td>
                        <td>
                          <span className={`st ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="num">{untilLabel(invite.expires_at)}</td>
                        <td>{invite.created_by ?? "Onbekend"}</td>
                        <td className="muted">
                          {[invite.email ? `Voor ${invite.email}` : null, invite.note].filter(Boolean).join(" · ") || "Zonder notitie"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {invite.status === "active" ? (
                            <button className="link" type="button" disabled={busyId === invite.id} onClick={() => revoke(invite.id)}>
                              Intrekken
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
              Een code is alleen direct na het maken te zien. Daarna bewaren we hem versleuteld, dus hier staat hij afgeschermd.
            </p>
          </>
        ) : (
          <EmptyState compact icon="key" text="Nog geen codes. Maak er een met Nieuwe uitnodiging." />
        )}
      </Panel>

      <NewInviteModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(invite) => {
          setItems((current) => [invite, ...current]);
          setFresh(invite.id);
          router.refresh();
        }}
      />
    </div>
  );
}

function NewInviteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (invite: AdminInvite) => void;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLSpanElement>(null);

  function close() {
    onClose();
    // Clear after the exit transition so the code does not flash away mid-animation.
    window.setTimeout(() => {
      setEmail("");
      setNote("");
      setCode(null);
      setError(null);
    }, 240);
  }

  async function create() {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), note: note.trim() }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(email.trim() ? "Controleer het e-mailadres en probeer het opnieuw." : "De code maken lukte niet. Probeer het opnieuw.");
      return;
    }
    setCode(body.invite.code);
    onCreated({
      id: body.invite.id,
      email: body.invite.email ?? null,
      note: body.invite.note ?? null,
      status: "active",
      expires_at: body.invite.expires_at,
      used_at: null,
      created_at: new Date().toISOString(),
      created_by: "Jij",
    });
  }

  async function copy() {
    if (!code) return;
    const ok = await copyText(code, codeRef.current);
    toast(ok ? "Code gekopieerd" : "Selecteer de code en kopieer hem zelf");
  }

  return (
    <Layer open={open} kind="modal" onClose={close} label="Nieuwe uitnodiging">
      <h3>Nieuwe uitnodiging</h3>
      <p className="muted">
        {code
          ? "Deel deze code met de persoon die je uitnodigt. Hij werkt één keer, is 24 uur geldig en je ziet hem hier maar één keer."
          : "Maak een code voor iemand die je kent. Hij werkt één keer en is 24 uur geldig."}
      </p>
      <div className="bigcode">
        <span className="code" ref={codeRef} aria-live="polite" style={code ? undefined : { color: "var(--muted)" }}>
          {code ?? MASK}
        </span>
        {code ? (
          <button className="btn ghost sm" type="button" onClick={copy} data-autofocus>
            <Icon name="copy" />
            Kopieer
          </button>
        ) : null}
      </div>
      {code ? null : (
        <>
          <label>
            Alleen geldig voor dit e-mailadres (optioneel)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@voorbeeld.nl" />
          </label>
          <label>
            Notitie voor jezelf
            <input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Bijvoorbeeld: collega van Ashraf" data-autofocus />
          </label>
        </>
      )}
      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      <div className="row">
        {code ? (
          <button className="btn primary" type="button" onClick={close}>
            Klaar
          </button>
        ) : (
          <>
            <button className="btn ghost" type="button" onClick={close}>
              Annuleren
            </button>
            <button className="btn primary" type="button" onClick={create} disabled={saving}>
              {saving ? "Bezig..." : "Code maken"}
            </button>
          </>
        )}
      </div>
    </Layer>
  );
}
