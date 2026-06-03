"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { CheckCircle2, Link2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { TagInput } from "@/components/onboarding/TagInput";
import { PUBLIC_FIELD_OPTIONS } from "@/lib/member-utils";
import type { Member } from "@/lib/types";

type FormState = Pick<
  Member,
  | "full_name"
  | "email"
  | "linkedin_url"
  | "photo_url"
  | "headline"
  | "role"
  | "company"
  | "location"
  | "about"
  | "skills"
  | "can_help_with"
  | "looking_for"
  | "languages"
  | "open_to_mentor"
  | "open_to_opportunities"
  | "open_to_collaborate"
  | "open_to_speaking"
  | "public_fields"
  | "consent_given"
>;

const emptyForm: FormState = {
  full_name: "",
  email: "",
  linkedin_url: "",
  photo_url: "",
  headline: "",
  role: "",
  company: "",
  location: "",
  about: "",
  skills: [],
  can_help_with: [],
  looking_for: [],
  languages: ["Dutch", "English"],
  open_to_mentor: false,
  open_to_opportunities: false,
  open_to_collaborate: false,
  open_to_speaking: false,
  public_fields: [],
  consent_given: false,
};

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const { data: session, status: sessionStatus } = useSession();
  const sessionError =
    sessionStatus !== "loading" && !session?.user ? "Onboarding incomplete: sign in with LinkedIn first, or configure Auth.js." : null;

  useEffect(() => {
    if (!session?.user) return;
    const timeout = window.setTimeout(() => {
      // Only fill what is still empty: the /api/me hydration below is the source
      // of truth for existing members and must not be clobbered by session data.
      setForm((current) => ({
        ...current,
        full_name: current.full_name || session.user.name || "",
        email: current.email || session.user.email || "",
        photo_url: current.photo_url || session.user.image || "",
      }));
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [session]);

  // Hydrate the form with the member's stored profile (when it exists), so editing
  // via /profile starts from the saved values instead of an empty form that would
  // overwrite everything (incl. public_fields) on save.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/me").catch(() => null);
      if (!response?.ok) return;
      const data = await response.json().catch(() => ({}));
      const member: Member | null = data?.member ?? null;
      if (!member || cancelled) return;
      setForm((current) => ({
        ...current,
        full_name: member.full_name || current.full_name,
        email: member.email || current.email,
        linkedin_url: member.linkedin_url ?? current.linkedin_url,
        photo_url: member.photo_url ?? current.photo_url,
        headline: member.headline ?? current.headline,
        role: member.role ?? current.role,
        company: member.company ?? current.company,
        location: member.location ?? current.location,
        about: member.about ?? current.about,
        skills: member.skills?.length ? member.skills : current.skills,
        can_help_with: member.can_help_with?.length ? member.can_help_with : current.can_help_with,
        looking_for: member.looking_for?.length ? member.looking_for : current.looking_for,
        languages: member.languages?.length ? member.languages : current.languages,
        open_to_mentor: member.open_to_mentor,
        open_to_opportunities: member.open_to_opportunities,
        open_to_collaborate: member.open_to_collaborate,
        open_to_speaking: member.open_to_speaking,
        public_fields: member.public_fields ?? current.public_fields,
        consent_given: member.consent_given || current.consent_given,
      }));
      if ((member.public_fields ?? []).length > 0) setPublicEnabled(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const progress = useMemo(() => Math.round(((step + 1) / 3) * 100), [step]);

  async function submit() {
    setError(null);
    if (!form.consent_given) {
      setError("Consent required before submitting your profile.");
      return;
    }
    if (!form.full_name || !form.email || !form.role || !form.location) {
      setError("Please complete your name, email, role and location.");
      return;
    }
    setStatus("saving");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "Could not save your profile.");
      setStatus("idle");
      return;
    }
    setStatus("success");
  }

  async function uploadPhoto(file: File) {
    setError(null);
    if (!session?.user?.id) {
      setError("Sign in with LinkedIn before uploading a profile photo.");
      return;
    }
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await fetch("/api/upload/profile-photo", { method: "POST", body: data });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Upload failed.");
      setForm((current) => ({ ...current, photo_url: body.url }));
    } catch {
      setError("Photo upload failed. Check the Vercel Blob token and upload limits.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[2rem] border border-charcoal/10 bg-white/78 p-10 text-center shadow-sm">
        <CheckCircle2 className="mx-auto h-14 w-14 text-deep-blue" />
        <h2 className="mt-5 text-3xl font-black text-charcoal">Your profile has been submitted.</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-charcoal/66">
          An IN-IT admin will review it before it becomes visible in the member hub.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-charcoal/10 bg-white/78 p-6 shadow-sm md:p-8">
      <div className="mb-8">
        <div className="h-2 overflow-hidden rounded-full bg-sand/60">
          <div className="h-full rounded-full bg-gradient-to-r from-deep-blue to-date transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm font-bold text-charcoal/58">Step {step + 1} of 3</p>
      </div>
      <motion.div key={step} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5">
        {step === 0 ? (
          <>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-dutch-blue/12 px-3 py-1 text-xs font-bold text-deep-blue">
              <Link2 className="h-3.5 w-3.5" />
              LinkedIn connected when Auth.js session exists
            </div>
            <Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
            <Field label="LinkedIn URL" value={form.linkedin_url ?? ""} onChange={(value) => setForm({ ...form, linkedin_url: value })} />
            <div className="rounded-3xl border border-charcoal/10 bg-sand/20 p-4">
              <span className="text-sm font-bold text-charcoal">Profile photo upload</span>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                {form.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photo_url} alt="" className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-charcoal/45">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => event.target.files?.[0] && uploadPhoto(event.target.files[0])}
                    className="block w-full text-sm text-charcoal file:mr-4 file:rounded-full file:border-0 file:bg-deep-blue file:px-4 file:py-2 file:text-sm file:font-bold file:text-white"
                  />
                  <p className="mt-2 text-xs leading-5 text-charcoal/55">PNG, JPG or WebP. The public URL is saved after upload.</p>
                </div>
              </div>
              <Field label="Photo URL" value={form.photo_url ?? ""} onChange={(value) => setForm({ ...form, photo_url: value })} />
            </div>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Field label="Headline" value={form.headline ?? ""} onChange={(value) => setForm({ ...form, headline: value })} />
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Role" value={form.role ?? ""} onChange={(value) => setForm({ ...form, role: value })} />
              <Field label="Company" value={form.company ?? ""} onChange={(value) => setForm({ ...form, company: value })} />
              <Field label="Location" value={form.location ?? ""} onChange={(value) => setForm({ ...form, location: value })} />
            </div>
            <label className="block">
              <span className="text-sm font-bold text-charcoal">About</span>
              <Textarea value={form.about ?? ""} onChange={(event) => setForm({ ...form, about: event.target.value })} />
            </label>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <TagInput label="Skills" value={form.skills} onChange={(skills) => setForm({ ...form, skills })} />
            <TagInput label="Can help with" value={form.can_help_with} onChange={(can_help_with) => setForm({ ...form, can_help_with })} />
            <TagInput label="Looking for" value={form.looking_for} onChange={(looking_for) => setForm({ ...form, looking_for })} />
            <TagInput label="Languages" value={form.languages} onChange={(languages) => setForm({ ...form, languages })} />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["open_to_mentor", "Open to mentor"],
                ["open_to_opportunities", "Open to opportunities"],
                ["open_to_collaborate", "Open to collaborate"],
                ["open_to_speaking", "Open to speaking"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-2xl bg-sand/35 p-3 text-sm font-bold text-charcoal">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof FormState])}
                    onChange={(event) => setForm({ ...form, [key]: event.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="rounded-2xl border border-charcoal/12 bg-white/70 p-4">
              <label className="flex items-start gap-3 text-sm font-bold leading-6 text-charcoal">
                <input
                  type="checkbox"
                  checked={publicEnabled}
                  onChange={(event) => {
                    setPublicEnabled(event.target.checked);
                    if (!event.target.checked) setForm({ ...form, public_fields: [] });
                  }}
                  className="mt-1"
                />
                Maak een publieke profielpagina beschikbaar (optioneel)
              </label>
              <p className="mt-2 text-xs leading-5 text-charcoal/55">
                Niet-ingelogde bezoekers zien dan alleen de velden die je hieronder zelf aanvinkt. Je naam wordt altijd
                getoond. Laat dit uit om volledig besloten te blijven.
              </p>
              {publicEnabled ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {PUBLIC_FIELD_OPTIONS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-sand/30 p-2.5 text-sm font-semibold text-charcoal">
                      <input
                        type="checkbox"
                        checked={form.public_fields.includes(key)}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            public_fields: event.target.checked
                              ? [...form.public_fields, key]
                              : form.public_fields.filter((field) => field !== key),
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <label className="flex items-start gap-3 rounded-2xl border border-date/18 bg-date/5 p-4 text-sm font-semibold leading-6 text-charcoal">
              <input
                type="checkbox"
                checked={form.consent_given}
                onChange={(event) => setForm({ ...form, consent_given: event.target.checked })}
                className="mt-1"
              />
              I consent to my submitted profile information being visible to other IN-IT community members after approval.
            </label>
          </>
        ) : null}
      </motion.div>
      {sessionError || error ? (
        <p className="mt-5 rounded-2xl bg-date/8 p-3 text-sm font-semibold text-date">{error ?? sessionError}</p>
      ) : null}
      <div className="mt-8 flex justify-between gap-3">
        <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < 2 ? <Button onClick={() => setStep(step + 1)}>Continue</Button> : <Button onClick={submit}>{status === "saving" ? "Submitting..." : "Submit for approval"}</Button>}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-charcoal">{label}</span>
      <div className="relative mt-2">
        <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={icon ? "pr-10" : undefined} />
        {icon ? <span className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40">{icon}</span> : null}
      </div>
    </label>
  );
}
