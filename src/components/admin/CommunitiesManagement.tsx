"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/app/EmptyState";
import { Panel } from "@/components/app/Panel";
import { useToast } from "@/components/app/Toast";
import { Cover, cropFor } from "@/components/app/Cover";
import { Layer } from "@/components/app/shell/Layer";
import { Icon } from "@/components/ui/icon";
import type { CommunityAdminView } from "@/lib/communities";

type Draft = { name: string; description: string; category: string; cover_image_url: string | null };
const emptyDraft: Draft = { name: "", description: "", category: "professional", cover_image_url: null };

// Groepen: table + one modal for create and edit, including an optional cover photo.
export function CommunitiesManagement({ communities }: { communities: CommunityAdminView[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(communities);
  const [seen, setSeen] = useState(communities);
  const [fresh, setFresh] = useState<string | null>(null);
  const [editing, setEditing] = useState<CommunityAdminView | "new" | null>(null);

  // Take over fresh server data after router.refresh().
  if (communities !== seen) {
    setSeen(communities);
    setItems(communities);
  }

  useEffect(() => {
    if (!fresh) return;
    const timer = window.setTimeout(() => setFresh(null), 600);
    return () => window.clearTimeout(timer);
  }, [fresh]);

  return (
    <div className="page">
      <div className="hello">
        <div>
          <h1>Groepen</h1>
          <p>Aanmaken, omslagfoto kiezen en bijwerken.</p>
        </div>
        <button className="btn primary" type="button" onClick={() => setEditing("new")}>
          <Icon name="plus" />
          Nieuwe groep
        </button>
      </div>

      <Panel>
        {items.length ? (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Groep</th>
                  <th>Soort</th>
                  <th>Leden</th>
                  <th>
                    <span className="sr-only-x">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id} className={fresh === c.id ? "fresh" : undefined}>
                    <td>
                      <span className="who2">
                        <Cover
                          crop={cropFor(c.slug)}
                          src={c.cover_image_url}
                          style={{ width: 56, height: 36, borderRadius: 10, flex: "none" }}
                        />
                        <span style={{ minWidth: 0 }}>
                          <b>{c.name}</b>
                          {c.description ? (
                            <small style={{ display: "block", maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.description}
                            </small>
                          ) : null}
                        </span>
                      </span>
                    </td>
                    <td>{c.category === "social" ? "Sociaal" : "Vakgroep"}</td>
                    <td className="num">{c.member_count}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="link" type="button" onClick={() => setEditing(c)}>
                        Bewerken
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState compact icon="groups" text="Nog geen groepen. Maak de eerste met Nieuwe groep." />
        )}
      </Panel>

      <GroupModal
        target={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, message) => {
          if (id) setFresh(id);
          toast(message);
          setEditing(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function GroupModal({
  target,
  onClose,
  onSaved,
}: {
  target: CommunityAdminView | "new" | null;
  onClose: () => void;
  onSaved: (id: string | null, message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const key = target === "new" ? "new" : target?.id ?? null;
  if (key && key !== loadedFor) {
    setLoadedFor(key);
    setError(null);
    setConfirmDelete(false);
    setDraft(
      target && target !== "new"
        ? { name: target.name, description: target.description ?? "", category: target.category, cover_image_url: target.cover_image_url ?? null }
        : emptyDraft,
    );
  }
  const existing = target && target !== "new" ? target : null;

  function close() {
    onClose();
    setLoadedFor(null);
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/admin/communities/cover", { method: "POST", body: form });
    const body = await response.json().catch(() => ({}));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (!response.ok || !body.url) {
      setError(body.error ?? "Uploaden lukte niet. Probeer het opnieuw.");
      return;
    }
    setDraft((d) => ({ ...d, cover_image_url: body.url }));
  }

  async function save() {
    if (draft.name.trim().length < 2) {
      setError("Geef de groep een naam van minstens twee tekens.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(existing ? `/api/admin/communities/${existing.id}` : "/api/admin/communities", {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        description: draft.description.trim(),
        category: draft.category,
        // POST accepts "" for none; PATCH accepts null to remove the photo.
        cover_image_url: draft.cover_image_url ?? (existing ? null : ""),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Opslaan lukte niet.");
      return;
    }
    setLoadedFor(null);
    onSaved(body.community?.id ?? existing?.id ?? null, existing ? "Groep bijgewerkt" : "Groep aangemaakt");
  }

  async function remove() {
    if (!existing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    const response = await fetch(`/api/admin/communities/${existing.id}`, { method: "DELETE" });
    setSaving(false);
    if (!response.ok) {
      setError("Verwijderen lukte niet.");
      return;
    }
    setLoadedFor(null);
    onSaved(null, `${existing.name} verwijderd`);
  }

  return (
    <Layer
      open={Boolean(target)}
      kind="modal"
      onClose={close}
      label={existing ? "Groep bewerken" : "Nieuwe groep"}
      style={{ maxHeight: "calc(100% - 40px)", overflowY: "auto" }}
    >
      <h3>{existing ? "Groep bewerken" : "Nieuwe groep"}</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <Cover
          crop={cropFor(existing?.slug ?? (draft.name || "nieuw"))}
          src={draft.cover_image_url}
          style={{ height: 120, borderRadius: 14 }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label className="btn ghost sm" style={{ display: "inline-flex", cursor: "pointer" }}>
            <Icon name="plus" />
            {uploading ? "Bezig met uploaden..." : draft.cover_image_url ? "Andere foto kiezen" : "Omslagfoto kiezen"}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only-x"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          {draft.cover_image_url ? (
            <button className="btn ghost sm" type="button" onClick={() => setDraft((d) => ({ ...d, cover_image_url: null }))}>
              Foto weghalen
            </button>
          ) : (
            <span className="muted" style={{ fontSize: 13 }}>
              Zonder foto krijgt de groep een uitsnede van de IN-IT-afbeelding.
            </span>
          )}
        </div>
      </div>
      <label>
        Naam
        <input value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} data-autofocus />
      </label>
      <label>
        Soort
        <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
          <option value="professional">Vakgroep</option>
          <option value="social">Sociaal</option>
        </select>
      </label>
      <label>
        Omschrijving
        <textarea value={draft.description} maxLength={500} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
      </label>
      {error ? (
        <p role="alert" style={{ color: "var(--accent)", fontSize: 13 }}>
          {error}
        </p>
      ) : null}
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        {existing ? (
          <button className="btn ghost" type="button" onClick={remove} disabled={saving} style={{ color: "var(--accent)" }}>
            {confirmDelete ? "Zeker weten? Leden en berichten gaan ook weg" : "Verwijderen"}
          </button>
        ) : (
          <span />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn ghost" type="button" onClick={close}>
            Annuleren
          </button>
          <button className="btn primary" type="button" onClick={save} disabled={saving || uploading}>
            {saving ? "Opslaan..." : existing ? "Opslaan" : "Groep aanmaken"}
          </button>
        </div>
      </div>
    </Layer>
  );
}
