"use client";

import { useState } from "react";
import { Ban, Check, EyeOff, Pencil, Save, Trash2, X } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Member } from "@/lib/types";
import { splitTags } from "@/lib/utils";

export function MemberManagementTable({
  members,
  pendingOnly = false,
}: {
  members: Member[];
  pendingOnly?: boolean;
}) {
  const [items, setItems] = useState(pendingOnly ? members.filter((member) => member.visibility_status === "pending") : members);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);

  async function update(id: string, action: "delete" | "status" | "edit", body?: Record<string, unknown>) {
    setError(null);
    const response = await fetch(`/api/admin/members/${id}`, {
      method: action === "delete" ? "DELETE" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: action === "delete" ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Admin action failed. Configure Neon, Auth.js and admin access.");
      return;
    }
    const result = await response.json().catch(() => ({}));
    if (action === "delete") setItems((current) => current.filter((item) => item.id !== id));
    if (result.member) setItems((current) => current.map((item) => (item.id === id ? result.member : item)));
    if (action === "edit") setEditing(null);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-charcoal/10 bg-white/74 shadow-sm">
      {error ? <p className="border-b border-date/10 bg-date/8 p-3 text-sm font-semibold text-date">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/40 text-xs uppercase tracking-wide text-charcoal/58">
            <tr>
              <th className="p-4">Member</th>
              <th className="p-4">Role</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4">Consent</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((member) => (
              <tr key={member.id} className="border-t border-charcoal/8">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-charcoal">{member.full_name}</p>
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold text-charcoal/70">
                      {member.member_type === "friend" ? "Vriend" : "Lid"}
                    </span>
                  </div>
                  <p className="text-charcoal/55">{member.email}</p>
                </td>
                <td className="p-4">{member.role}</td>
                <td className="p-4">{member.location}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      member.visibility_status === "deactivated"
                        ? "bg-date/12 text-date"
                        : "bg-dutch-blue/12 text-deep-blue"
                    }`}
                  >
                    {member.visibility_status}
                  </span>
                </td>
                <td className="p-4">{member.consent_given ? "Yes" : "No"}</td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" onClick={() => update(member.id, "status", { visibility_status: "approved" })} aria-label="Approve member">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => update(member.id, "status", { visibility_status: "rejected" })} aria-label="Reject member">
                      <X className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => update(member.id, "status", { visibility_status: "hidden" })} aria-label="Hide member">
                      <EyeOff className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        update(member.id, "status", {
                          visibility_status: member.visibility_status === "deactivated" ? "approved" : "deactivated",
                        })
                      }
                      aria-label={member.visibility_status === "deactivated" ? "Reactivate member" : "Deactivate member"}
                      title={member.visibility_status === "deactivated" ? "Reactiveren" : "Direct deactiveren"}
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={() => setEditing(member)} aria-label="Edit member">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="danger" onClick={() => update(member.id, "delete")} aria-label="Delete member">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing ? (
        <EditMemberModal
          member={editing}
          onClose={() => setEditing(null)}
          onSave={(payload) => update(editing.id, "edit", payload)}
        />
      ) : null}
    </div>
  );
}

function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: Member;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const [draft, setDraft] = useState({
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
  });

  function setValue(key: keyof typeof draft, value: string | boolean) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function save() {
    onSave({
      ...draft,
      skills: splitTags(draft.skills),
      can_help_with: splitTags(draft.can_help_with),
      looking_for: splitTags(draft.looking_for),
      languages: splitTags(draft.languages),
    });
  }

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-charcoal/45 p-4 backdrop-blur-sm">
      <div className="mx-auto my-8 max-w-4xl rounded-[2rem] border border-charcoal/10 bg-off-white p-5 shadow-2xl md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-date">Edit member</p>
            <h2 className="mt-2 text-3xl font-black text-charcoal">{member.full_name}</h2>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} aria-label="Close edit modal">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <AdminField label="Full name" value={draft.full_name} onChange={(value) => setValue("full_name", value)} />
          <AdminField label="Email" value={draft.email} onChange={(value) => setValue("email", value)} />
          <AdminField label="LinkedIn URL" value={draft.linkedin_url} onChange={(value) => setValue("linkedin_url", value)} />
          <AdminField label="Photo URL" value={draft.photo_url} onChange={(value) => setValue("photo_url", value)} />
          <AdminField label="Headline" value={draft.headline} onChange={(value) => setValue("headline", value)} className="md:col-span-2" />
          <AdminField label="Role" value={draft.role} onChange={(value) => setValue("role", value)} />
          <AdminField label="Company" value={draft.company} onChange={(value) => setValue("company", value)} />
          <AdminField label="Location" value={draft.location} onChange={(value) => setValue("location", value)} />
          <label className="block">
            <span className="text-sm font-bold text-charcoal">Status</span>
            <select
              value={draft.visibility_status}
              onChange={(event) => setValue("visibility_status", event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 text-sm font-semibold text-charcoal outline-none"
            >
              {["pending", "approved", "hidden", "rejected", "deactivated"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-charcoal">Type</span>
            <select
              value={draft.member_type}
              onChange={(event) => setValue("member_type", event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-charcoal/12 bg-white/80 px-4 text-sm font-semibold text-charcoal outline-none"
            >
              <option value="member">Lid</option>
              <option value="friend">Vriend van IN-IT</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-bold text-charcoal">About</span>
            <Textarea value={draft.about} onChange={(event) => setValue("about", event.target.value)} className="mt-2" />
          </label>
          <AdminField label="Skills" value={draft.skills} onChange={(value) => setValue("skills", value)} />
          <AdminField label="Can help with" value={draft.can_help_with} onChange={(value) => setValue("can_help_with", value)} />
          <AdminField label="Looking for" value={draft.looking_for} onChange={(value) => setValue("looking_for", value)} />
          <AdminField label="Languages" value={draft.languages} onChange={(value) => setValue("languages", value)} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["consent_given", "Consent given"],
            ["open_to_mentor", "Mentor"],
            ["open_to_opportunities", "Open to work"],
            ["open_to_collaborate", "Collaborate"],
            ["open_to_speaking", "Speaker"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 rounded-2xl bg-white/75 p-3 text-sm font-bold text-charcoal">
              <input
                type="checkbox"
                checked={Boolean(draft[key as keyof typeof draft])}
                onChange={(event) => setValue(key as keyof typeof draft, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>
            <Save className="h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="text-sm font-bold text-charcoal">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2" />
    </label>
  );
}
