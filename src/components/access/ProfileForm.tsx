"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/app/Avatar";
import { useToast } from "@/components/app/Toast";
import { Stepper } from "@/components/access/Stepper";
import { Icon } from "@/components/ui/icon";
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

const EMPTY: FormState = {
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

// Vakgebied chips are stored as skills, so the member directory can filter on them.
const FIELDS = ["Software", "Cloud", "Security", "Data", "Product en design", "Infra", "Student"];

const OPEN_TO: { key: "open_to_mentor" | "open_to_opportunities" | "open_to_collaborate" | "open_to_speaking"; label: string }[] = [
  { key: "open_to_mentor", label: "Mentor zijn" },
  { key: "open_to_collaborate", label: "Samenwerken" },
  { key: "open_to_opportunities", label: "Nieuwe kansen" },
  { key: "open_to_speaking", label: "Spreken op events" },
];

const areaStyle: React.CSSProperties = {
  minHeight: 96,
  border: "1px solid var(--line-strong)",
  borderRadius: 12,
  padding: "10px 14px",
  outline: 0,
  fontSize: 14.5,
  resize: "vertical",
  font: "inherit",
};

/**
 * `new`: step 2 of joining (stepper, "Aanvraag versturen", then /wachten).
 * `edit`: an approved member edits the profile (no stepper, back to /profile).
 * The form hydrates from GET /api/me before it can be sent, so a save never wipes stored fields.
 */
export function ProfileForm({ mode, returnTo }: { mode: "new" | "edit"; returnTo: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [existing, setExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publicOn, setPublicOn] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Session data only fills what is still empty; /api/me below wins for existing members.
  useEffect(() => {
    if (!session?.user) return;
    const t = window.setTimeout(() => {
      setForm((c) => ({
        ...c,
        full_name: c.full_name || session.user.name || "",
        email: c.email || session.user.email || "",
        photo_url: c.photo_url || session.user.image || "",
      }));
    }, 0);
    return () => window.clearTimeout(t);
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/me").catch(() => null);
      const data = res?.ok ? await res.json().catch(() => ({})) : {};
      const m: Member | null = data?.member ?? null;
      if (cancelled) return;
      if (m) {
        setExisting(true);
        setForm((c) => ({
          ...c,
          full_name: m.full_name || c.full_name,
          email: m.email || c.email,
          linkedin_url: m.linkedin_url ?? c.linkedin_url,
          photo_url: m.photo_url ?? c.photo_url,
          headline: m.headline ?? c.headline,
          role: m.role ?? c.role,
          company: m.company ?? c.company,
          location: m.location ?? c.location,
          about: m.about ?? c.about,
          skills: m.skills?.length ? m.skills : c.skills,
          can_help_with: m.can_help_with?.length ? m.can_help_with : c.can_help_with,
          looking_for: m.looking_for?.length ? m.looking_for : c.looking_for,
          languages: m.languages?.length ? m.languages : c.languages,
          open_to_mentor: m.open_to_mentor,
          open_to_opportunities: m.open_to_opportunities,
          open_to_collaborate: m.open_to_collaborate,
          open_to_speaking: m.open_to_speaking,
          public_fields: m.public_fields ?? c.public_fields,
          consent_given: m.consent_given || c.consent_given,
        }));
        if ((m.public_fields ?? []).length) setPublicOn(true);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((c) => ({ ...c, [key]: value }));
  const toggleIn = (key: "skills" | "public_fields", value: string) =>
    setForm((c) => ({ ...c, [key]: c[key].includes(value) ? c[key].filter((x) => x !== value) : [...c[key], value] }));

  const missing = !(form.role ?? "").trim() ? "rol" : !(form.location ?? "").trim() ? "woonplaats" : null;
  const canSend = loaded && form.consent_given && !missing && !saving && !uploading;
  const hint = !form.consent_given || missing
    ? "Vul je rol en woonplaats in en geef akkoord om te versturen."
    : mode === "edit"
      ? "Je wijzigingen zijn meteen zichtbaar voor leden."
      : "Na het versturen beoordeelt de coördinator je aanvraag.";

  async function uploadPhoto(file: File) {
    setError(null);
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/upload/profile-photo", { method: "POST", body: data });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.url) throw new Error();
      set("photo_url", body.url);
    } catch {
      setError("De foto uploaden lukte niet. Probeer een kleinere foto, of probeer het zo opnieuw.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    setError(null);
    if ((form.full_name ?? "").trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email ?? "")) {
      setError("Vul je naam en een geldig e-mailadres in.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    if (!res?.ok) {
      setError(
        res?.status === 401
          ? "Je bent uitgelogd. Log opnieuw in met LinkedIn en probeer het nog eens."
          : "Opslaan lukte niet. Controleer je gegevens en probeer het opnieuw.",
      );
      setSaving(false);
      return;
    }
    toast(mode === "edit" ? "Profiel opgeslagen" : existing ? "Je gegevens zijn bijgewerkt" : "Aanvraag verstuurd");
    router.push(returnTo);
    router.refresh();
  }

  const title = mode === "edit" ? "Profiel bewerken" : "Nog even je profiel";
  const sub =
    mode === "edit"
      ? "Pas aan wat leden van je zien. Je kunt dit altijd weer wijzigen."
      : "Zo weet de coördinator wie je bent. Je kunt alles later aanpassen.";
  const cta = mode === "edit" ? "Opslaan" : existing ? "Wijzigingen opslaan" : "Aanvraag versturen";

  return (
    <>
      {mode === "new" ? <Stepper step={2} /> : null}
      <div>
        <h1>{title}</h1>
        <p className="sub" style={{ marginTop: 6 }}>
          {sub}
        </p>
      </div>
      <form className="fgrid" onSubmit={submit} aria-busy={!loaded}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={form.full_name || "?"} photoUrl={form.photo_url || null} size="lg" />
          <div style={{ display: "grid", gap: 4 }}>
            <button className="btn ghost sm" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Icon name="user" />
              {uploading ? "Foto uploaden..." : form.photo_url ? "Andere foto kiezen" : "Foto kiezen"}
            </button>
            <span className="fine">PNG, JPG of WebP</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void uploadPhoto(f);
              e.target.value = "";
            }}
          />
        </div>
        <label>
          <span className="lbl">Naam</span>
          <input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Komt van LinkedIn" autoComplete="name" />
        </label>
        <label>
          <span className="lbl">E-mailadres</span>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Komt van LinkedIn" autoComplete="email" />
        </label>
        <label>
          <span className="lbl">Rol of functie</span>
          <input value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Bijvoorbeeld cloud engineer" autoComplete="organization-title" />
        </label>
        <label>
          <span className="lbl">Woonplaats</span>
          <input value={form.location ?? ""} onChange={(e) => set("location", e.target.value)} placeholder="Bijvoorbeeld Rotterdam" autoComplete="address-level2" />
        </label>
        <div style={{ display: "grid", gap: 6 }} role="group" aria-labelledby="vak-lbl">
          <span className="lbl" id="vak-lbl">
            Vakgebied
          </span>
          <div className="choice">
            {FIELDS.map((f) => {
              const on = form.skills.includes(f);
              return (
                <button key={f} type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => toggleIn("skills", f)}>
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        <details style={{ display: "grid", gap: 12 }} open={mode === "edit" ? true : undefined}>
          <summary className="lbl" style={{ cursor: "pointer", padding: "6px 0" }}>
            Meer over jou (optioneel)
          </summary>
          <div className="fgrid" style={{ marginTop: 10 }}>
            <label>
              <span className="lbl">Korte omschrijving</span>
              <input value={form.headline ?? ""} onChange={(e) => set("headline", e.target.value)} placeholder="Bijvoorbeeld: bouwt veilige cloudplatformen" />
            </label>
            <label>
              <span className="lbl">Werkgever</span>
              <input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} autoComplete="organization" />
            </label>
            <label>
              <span className="lbl">LinkedIn-profiel</span>
              <input value={form.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} placeholder="linkedin.com/in/..." inputMode="url" />
            </label>
            <label>
              <span className="lbl">Over jou</span>
              <textarea style={areaStyle} value={form.about ?? ""} onChange={(e) => set("about", e.target.value)} />
            </label>
            <div style={{ display: "grid", gap: 6 }} role="group" aria-labelledby="open-lbl">
              <span className="lbl" id="open-lbl">
                Ik sta open voor
              </span>
              <div className="choice">
                {OPEN_TO.map(({ key, label }) => (
                  <button key={key} type="button" className={form[key] ? "on" : undefined} aria-pressed={form[key]} onClick={() => set(key, !form[key])}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <Check on={publicOn} onToggle={() => {
                const next = !publicOn;
                setPublicOn(next);
                if (!next) set("public_fields", []);
              }}>
                Maak een openbare profielpagina. Bezoekers zien alleen je naam en de velden die je hieronder kiest.
              </Check>
              {publicOn ? (
                <div className="choice" role="group" aria-label="Zichtbaar op je openbare pagina">
                  {PUBLIC_FIELD_OPTIONS.map(({ key, label }) => {
                    const on = form.public_fields.includes(key);
                    return (
                      <button key={key} type="button" className={on ? "on" : undefined} aria-pressed={on} onClick={() => toggleIn("public_fields", key)}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </details>

        <Check on={form.consent_given} onToggle={() => set("consent_given", !form.consent_given)}>
          Ik ga akkoord dat leden van IN-IT mijn profiel zien zodra ik ben goedgekeurd. Per veld kies ik later wat zichtbaar is.
        </Check>

        {error ? (
          <p className="msg err" role="alert">
            <Icon name="info" />
            {error}
          </p>
        ) : null}
        <button className="btn primary full" type="submit" disabled={!canSend} aria-busy={saving}>
          {saving ? "Even opslaan..." : cta}
        </button>
        <p className="fine" aria-live="polite">
          {loaded ? hint : "Je gegevens worden geladen..."}
        </p>
      </form>
    </>
  );
}

// Checkbox in the `.consent` style: the check scales in when switched on.
function Check({ on, onToggle, children }: { on: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} className={`consent${on ? " on" : ""}`} onClick={onToggle} style={{ textAlign: "left", border: 0, width: "100%" }}>
      <span className="box">
        <Icon name="check" />
      </span>
      <span>{children}</span>
    </button>
  );
}
