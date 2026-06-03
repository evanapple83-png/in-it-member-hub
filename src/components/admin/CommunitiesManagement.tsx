"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ExternalLink, Pencil, Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type AdminCommunity = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  member_count: number;
};

type Draft = {
  name: string;
  description: string;
  category: string;
};

const emptyDraft: Draft = { name: "", description: "", category: "professional" };

export function CommunitiesManagement() {
  const { status: sessionStatus } = useSession();
  const [communities, setCommunities] = useState<AdminCommunity[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "unauthorized">("loading");
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await fetch("/api/admin/communities");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setState("unauthorized");
      setError(body.error ?? "Niet geautoriseerd.");
      return;
    }
    setCommunities(body.communities ?? []);
    setState("ready");
  }

  useEffect(() => {
    if (sessionStatus === "loading") return;
    async function init() {
      if (sessionStatus !== "authenticated") {
        setState("unauthorized");
        setError("Log in als beheerder om communities te beheren.");
        return;
      }
      try {
        await load();
      } catch {
        setState("unauthorized");
        setError("Communitybeheer is beveiligd. Log in als beheerder om verder te gaan.");
      }
    }
    void init();
  }, [sessionStatus]);

  async function save() {
    if (!draft.name.trim()) {
      setError("Naam is verplicht.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(editingId ? `/api/admin/communities/${editingId}` : "/api/admin/communities", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(),
        description: draft.description,
        category: draft.category,
      }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Opslaan mislukt.");
      return;
    }
    setDraft(emptyDraft);
    setEditingId(null);
    await load();
  }

  function startEdit(community: AdminCommunity) {
    setEditingId(community.id);
    setDraft({
      name: community.name,
      description: community.description ?? "",
      category: community.category,
    });
    setError(null);
  }

  async function remove(community: AdminCommunity) {
    const confirmed = window.confirm(
      `"${community.name}" verwijderen? Alle lidmaatschappen en berichten in deze community worden ook verwijderd.`,
    );
    if (!confirmed) return;
    const response = await fetch(`/api/admin/communities/${community.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Verwijderen mislukt.");
      return;
    }
    if (editingId === community.id) {
      setEditingId(null);
      setDraft(emptyDraft);
    }
    await load();
  }

  if (state === "loading") return <LoadingSkeleton className="h-72" />;

  if (state === "unauthorized") {
    return (
      <div className="rounded-[2rem] border border-date/15 bg-white/78 p-8 shadow-sm">
        <ShieldAlert className="h-10 w-10 text-date" />
        <h2 className="mt-4 text-2xl font-black text-charcoal">Communitybeheer beveiligd</h2>
        <p className="mt-3 max-w-2xl leading-7 text-charcoal/66">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[2rem] border border-charcoal/10 bg-white/82 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-deep-blue text-white">
            {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          </span>
          <h2 className="text-2xl font-black text-charcoal">{editingId ? "Community bewerken" : "Nieuwe community"}</h2>
        </div>
        <div className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-bold text-charcoal">
              Naam *
              <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Bijv. Data & AI" />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-charcoal">
              Categorie
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                className="h-11 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 text-sm text-charcoal shadow-sm outline-none transition focus:border-deep-blue/40 focus:ring-4 focus:ring-dutch-blue/20"
              >
                <option value="professional">Professioneel</option>
                <option value="social">Sociaal</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1.5 text-sm font-bold text-charcoal">
            Omschrijving
            <Textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="Waar gaat deze community over en voor wie is hij bedoeld?"
            />
          </label>
          {error ? <p className="text-sm font-semibold text-date">{error}</p> : null}
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={saving}>
              {saving ? "Opslaan..." : editingId ? "Wijzigingen opslaan" : "Community aanmaken"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setDraft(emptyDraft);
                  setError(null);
                }}
              >
                Annuleren
              </Button>
            ) : (
              <p className="text-xs text-charcoal/50">Direct zichtbaar voor geautoriseerde leden op de communitypagina.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {communities.map((community) => (
          <div key={community.id} className="rounded-3xl border border-charcoal/10 bg-white/82 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-charcoal">{community.name}</h3>
                  <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.14em] text-date">
                    {community.category === "social" ? "Sociaal" : "Professioneel"}
                  </span>
                </div>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-charcoal/60">
                  <Users className="h-4 w-4" />
                  {community.member_count} {community.member_count === 1 ? "lid" : "leden"}
                </p>
                {community.description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-charcoal/62">{community.description}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/communities/${community.slug}`}>
                    <ExternalLink className="h-4 w-4" />
                    Bekijken
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => startEdit(community)}>
                  <Pencil className="h-4 w-4" />
                  Bewerken
                </Button>
                <Button size="icon" variant="danger" onClick={() => remove(community)} aria-label="Verwijderen">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {communities.length === 0 ? <p className="text-sm font-semibold text-charcoal/55">Nog geen communities aangemaakt.</p> : null}
      </div>
    </div>
  );
}
