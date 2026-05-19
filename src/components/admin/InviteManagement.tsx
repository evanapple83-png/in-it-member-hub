"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

type Invite = {
  id: string;
  code?: string;
  email?: string | null;
  note?: string | null;
  status: string;
  expires_at: string;
  used_at?: string | null;
  created_at?: string;
};

export function InviteManagement() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [freshCode, setFreshCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadInvites() {
    const response = await fetch("/api/admin/invites");
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error ?? "Could not load invites.");
    setInvites(body.invites ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadInvites()
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function createInvite() {
    setSaving(true);
    setError(null);
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, note }),
    });
    const body = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(body.error ?? "Could not create invite.");
      return;
    }
    setFreshCode(body.invite.code);
    setEmail("");
    setNote("");
    await loadInvites();
  }

  async function revokeInvite(id: string) {
    await fetch("/api/admin/invites", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "revoked" }),
    });
    await loadInvites();
  }

  if (loading) return <LoadingSkeleton className="h-72" />;

  return (
    <div className="grid gap-6">
      <div className="rounded-[2rem] border border-charcoal/10 bg-white/78 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-deep-blue text-white">
            <KeyRound className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-charcoal">Create 24-hour invite</h2>
            <p className="mt-2 text-sm leading-6 text-charcoal/62">
              Codes are shown once, expire after 24 hours and unlock LinkedIn sign-in only for the invitee.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Optional email lock" />
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal admin note" />
          <Button onClick={createInvite} disabled={saving}>
            {saving ? "Creating..." : "Create invite"}
          </Button>
        </div>
        {freshCode ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl bg-sand/45 p-4">
            <p className="font-mono text-lg font-black text-charcoal">{freshCode}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(freshCode)}>
              <Copy className="h-4 w-4" />
              Copy
            </Button>
            <p className="text-sm font-semibold text-charcoal/58">Share this privately. It will not be shown again.</p>
          </div>
        ) : null}
        {error ? <p className="mt-4 text-sm font-semibold text-date">{error}</p> : null}
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-charcoal/10 bg-white/78 shadow-sm">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-charcoal/10 px-5 py-4 text-xs font-black uppercase tracking-[0.14em] text-charcoal/50">
          <span>Email</span>
          <span>Status</span>
          <span>Expires</span>
          <span>Action</span>
        </div>
        {invites.map((invite) => (
          <div key={invite.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 border-b border-charcoal/8 px-5 py-4 text-sm">
            <span className="font-semibold text-charcoal">{invite.email || "Any invited contact"}</span>
            <span className="font-bold capitalize text-charcoal/70">{invite.status}</span>
            <span className="text-charcoal/58">{new Date(invite.expires_at).toLocaleString("nl-NL")}</span>
            <Button type="button" variant="ghost" size="sm" disabled={invite.status !== "active"} onClick={() => revokeInvite(invite.id)}>
              <RotateCcw className="h-4 w-4" />
              Revoke
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
