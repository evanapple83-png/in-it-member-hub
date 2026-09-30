"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/app/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { useToast } from "@/components/app/Toast";
import { Icon } from "@/components/ui/icon";
import { agoLabel, copyText, prefersReducedMotion } from "@/components/admin/format";
import type { AccessRequest, Member } from "@/lib/types";

type Item =
  | { kind: "member"; id: string; member: Member }
  | { kind: "request"; id: string; request: AccessRequest };

const LEAVE_MS = 280;

// Review queue used on Overzicht and Aanvragen: pending accounts + open access requests, each
// with inline Goedkeuren / Afwijzen. An approved or rejected card slides out, then the server
// data refreshes (so the sidebar badge and the Recent feed follow).
export function ReviewQueue({
  pendingMembers,
  openRequests,
  variant,
}: {
  pendingMembers: Member[];
  openRequests: AccessRequest[];
  variant: "overview" | "requests";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [gone, setGone] = useState<Set<string>>(new Set());
  const [leaving, setLeaving] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<{ name: string; code: string; emailed: boolean } | null>(null);
  const codeRef = useRef<HTMLSpanElement>(null);

  const members = pendingMembers.filter((m) => !gone.has(m.id));
  const requests = openRequests.filter((r) => !gone.has(r.id));

  async function slideOut(id: string) {
    if (!prefersReducedMotion()) {
      setLeaving(id);
      await new Promise((resolve) => window.setTimeout(resolve, LEAVE_MS));
    }
    setGone((current) => new Set(current).add(id));
    setLeaving(null);
    router.refresh();
  }

  async function review(item: Item, action: "approve" | "reject", reason: string): Promise<string | null> {
    const note = reason.trim() || undefined;
    const response =
      item.kind === "member"
        ? await fetch(`/api/admin/members/${item.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              action === "approve"
                ? { visibility_status: "approved" }
                : { visibility_status: "rejected", rejection_reason: note ?? null },
            ),
          })
        : await fetch("/api/admin/requests", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, action, note }),
          });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return body.error ?? "Dat lukte niet. Probeer het opnieuw.";

    const name = item.kind === "member" ? item.member.full_name : item.request.full_name;
    if (item.kind === "request" && action === "approve" && body.code) {
      setFreshCode({ name, code: body.code, emailed: Boolean(body.emailed) });
    }
    toast(
      action === "approve"
        ? item.kind === "member"
          ? `${name} is goedgekeurd`
          : `Aanvraag van ${name} goedgekeurd`
        : `${name} afgewezen`,
    );
    await slideOut(item.id);
    return null;
  }

  async function copy() {
    if (!freshCode) return;
    const ok = await copyText(freshCode.code, codeRef.current);
    toast(ok ? "Code gekopieerd" : "Selecteer de code en kopieer hem zelf");
  }

  const memberTitle = variant === "overview" ? "Wacht op goedkeuring" : "Accounts die wachten";

  return (
    <>
      <Panel title={memberTitle} count={members.length || undefined} countAccent>
        {members.length ? (
          members.map((member) => (
            <ReqCard
              key={member.id}
              item={{ kind: "member", id: member.id, member }}
              leaving={leaving === member.id}
              onReview={review}
            />
          ))
        ) : variant === "overview" ? (
          <EmptyState compact text="Niemand wacht. Nieuwe aanvragen verschijnen hier en in de teller links." />
        ) : (
          <p className="muted">Niemand wacht op goedkeuring.</p>
        )}
      </Panel>

      <Panel title="Toegangsaanvragen zonder code" count={requests.length || undefined} countAccent>
        {freshCode ? (
          <div className="stack" style={{ gap: 8, marginBottom: requests.length ? 12 : 0 }}>
            <div className="bigcode">
              <span className="code" ref={codeRef}>
                {freshCode.code}
              </span>
              <button className="btn ghost sm" type="button" onClick={copy}>
                <Icon name="copy" />
                Kopieer
              </button>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              {freshCode.emailed
                ? `De code is naar ${freshCode.name} gemaild. Hij is 24 uur geldig en je ziet hem hier maar één keer.`
                : `Er is geen mail verstuurd. Deel de code zelf met ${freshCode.name}, hij is 24 uur geldig en je ziet hem hier maar één keer.`}
            </p>
          </div>
        ) : null}
        {requests.length ? (
          requests.map((request) => (
            <ReqCard
              key={request.id}
              item={{ kind: "request", id: request.id, request }}
              leaving={leaving === request.id}
              onReview={review}
            />
          ))
        ) : (
          <p className="muted" style={{ fontSize: 14 }}>
            Geen open aanvragen. Mensen zonder code kunnen via de publieke site toegang vragen of voorgedragen worden, die komen
            hier binnen.
          </p>
        )}
      </Panel>
    </>
  );
}

function ReqCard({
  item,
  leaving,
  onReview,
}: {
  item: Item;
  leaving: boolean;
  onReview: (item: Item, action: "approve" | "reject", reason: string) => Promise<string | null>;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = `rr-${item.id}`;

  async function run(action: "approve" | "reject") {
    setBusy(true);
    setError(null);
    const failure = await onReview(item, action, action === "reject" ? reason : "");
    if (failure) {
      setError(failure);
      setBusy(false);
    }
  }

  function openReject() {
    setRejectOpen(true);
    window.setTimeout(() => textRef.current?.focus(), 30);
  }

  let name: string;
  let lines: React.ReactNode[];
  if (item.kind === "member") {
    const m = item.member;
    name = m.full_name;
    const work = [m.role, m.company].filter(Boolean).join(" bij ");
    lines = [
      [work || "Geen rol ingevuld", m.location].filter(Boolean).join(", ") + (m.member_type === "friend" ? " · Vriend van IN-IT" : ""),
      `Account aangemaakt ${agoLabel(m.created_at)}`,
    ];
  } else {
    const r = item.request;
    name = r.full_name;
    lines = [
      `${r.email}${r.phone ? ` · ${r.phone}` : ""} · ${r.requester_type === "friend" ? "Vriend" : "Lid"}`,
      <>
        {r.proposed_by_member_id ? "Voorgedragen door een lid · " : ""}
        Vroeg toegang {agoLabel(r.created_at)}
        {r.linkedin_url ? (
          <>
            {" · "}
            <a href={r.linkedin_url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
              LinkedIn
            </a>
          </>
        ) : null}
      </>,
    ];
    if (r.motivation) lines.push(<span style={{ color: "var(--ink)" }}>{r.motivation}</span>);
  }

  return (
    <div className={leaving ? "req leaving" : "req"}>
      {item.kind === "member" ? (
        <Avatar name={name} photoUrl={item.member.photo_url} id={item.id} />
      ) : (
        <Avatar name={name} id={item.id} />
      )}
      <div className="t">
        <b>{name}</b>
        {lines.map((line, i) => (
          <small key={i}>{line}</small>
        ))}
      </div>
      <div className="acts">
        <button className="btn ghost sm" type="button" disabled={busy} onClick={openReject} aria-expanded={rejectOpen}>
          Afwijzen
        </button>
        <button className="btn primary sm" type="button" disabled={busy} onClick={() => run("approve")}>
          <Icon name="check" />
          Goedkeuren
        </button>
      </div>
      {rejectOpen ? (
        <div className="reject">
          <label className="lbl" htmlFor={fieldId}>
            {item.kind === "member" ? "Toelichting voor de aanvrager (optioneel)" : "Reden, alleen zichtbaar voor beheer (optioneel)"}
          </label>
          <textarea
            id={fieldId}
            ref={textRef}
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Bijvoorbeeld: we konden je niet koppelen aan het netwerk"
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="btn ghost sm"
              type="button"
              disabled={busy}
              onClick={() => {
                setRejectOpen(false);
                setReason("");
              }}
            >
              Annuleren
            </button>
            <button className="btn sm" style={{ background: "var(--accent)", color: "#fff" }} type="button" disabled={busy} onClick={() => run("reject")}>
              Afwijzen
            </button>
          </div>
        </div>
      ) : null}
      {error ? (
        <p role="alert" style={{ gridColumn: "1 / -1", color: "var(--accent)", fontSize: 13 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
