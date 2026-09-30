"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { LinkedInSignIn } from "@/components/access/LinkedInSignIn";
import { Stepper } from "@/components/access/Stepper";

type CodeState = { ok: boolean; text: string } | null;

// Only the 8 hex characters after "INIT-" are typed; the prefix is fixed in the field.
export function cleanCode(raw: string) {
  return raw.toUpperCase().trim().replace(/^INIT-?/, "").replace(/[^0-9A-F]/g, "").slice(0, 8);
}

function formatUntil(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

export function InviteCodeForm({ initialCode = "" }: { initialCode?: string }) {
  const [code, setCode] = useState(() => cleanCode(initialCode));
  const [state, setState] = useState<CodeState>(null);
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const fieldRef = useRef<HTMLDivElement>(null);

  const check = useCallback(async (value: string) => {
    setBusy(true);
    let next: CodeState;
    if (value.length < 8) {
      next = { ok: false, text: "Vul de 8 tekens van je code in." };
    } else {
      const res = await fetch("/api/invites/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: `INIT-${value}` }),
      }).catch(() => null);
      const body = await res?.json().catch(() => ({}));
      if (res?.ok) {
        const until = body?.expires_at ? formatUntil(body.expires_at) : null;
        next = { ok: true, text: until ? `Code klopt. Geldig tot ${until}.` : "Code klopt." };
      } else if (res?.status === 404) {
        next = { ok: false, text: "Deze code klopt niet, is verlopen of al gebruikt. Vraag de beheerder om een nieuwe." };
      } else if (res?.status === 400) {
        next = { ok: false, text: "Vul de 8 tekens van je code in." };
      } else {
        next = { ok: false, text: "Controleren lukt nu even niet. Probeer het zo opnieuw." };
      }
    }
    setState(next);
    if (!next.ok) setAttempt((n) => n + 1);
    setBusy(false);
  }, []);

  // A link with ?code= checks itself once on arrival.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || cleanCode(initialCode).length !== 8) return;
    prefilled.current = true;
    const t = window.setTimeout(() => void check(cleanCode(initialCode)), 0);
    return () => window.clearTimeout(t);
  }, [initialCode, check]);

  // Restart the shake on every failed attempt, also when the class was already there.
  useEffect(() => {
    const el = fieldRef.current;
    if (!attempt || !el) return;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
  }, [attempt]);

  const ok = Boolean(state?.ok);

  return (
    <>
      <Stepper step={ok ? 1 : 0} />
      <div>
        <h1>Je bent uitgenodigd</h1>
        <p className="sub" style={{ marginTop: 6 }}>
          Vul de code in die je van een beheerder kreeg. Hij is 24 uur geldig en werkt één keer.
        </p>
      </div>
      <form
        style={{ display: "grid", gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!ok && !busy) void check(code);
        }}
      >
        <label className="lbl" htmlFor="code">
          Uitnodigingscode
        </label>
        <div ref={fieldRef} className={`codefield${state ? (state.ok ? " ok" : " err") : ""}`}>
          <span className="pre" aria-hidden="true">
            INIT-
          </span>
          <input
            id="code"
            name="code"
            value={code}
            maxLength={8}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            placeholder="8 tekens"
            aria-describedby="cmsg"
            aria-invalid={state && !state.ok ? true : undefined}
            onChange={(e) => {
              setCode(cleanCode(e.target.value));
              if (state) setState(null);
            }}
          />
        </div>
        <div id="cmsg" aria-live="polite">
          {state ? (
            <p className={`msg ${state.ok ? "ok" : "err"}`}>
              <Icon name={state.ok ? "check" : "info"} />
              {state.text}
            </p>
          ) : null}
        </div>
        {!ok ? (
          <button data-press className="btn dark full" type="submit" disabled={busy} aria-busy={busy}>
            {busy ? "Even controleren..." : "Code controleren"}
          </button>
        ) : null}
      </form>
      {ok ? (
        <>
          <LinkedInSignIn label="Account maken met LinkedIn" />
          <p className="fine">We gebruiken je naam, foto en e-mailadres van LinkedIn. Je profiel is pas zichtbaar na goedkeuring.</p>
        </>
      ) : null}
      <div className="or">al lid</div>
      <Link data-press className="btn ghost full" href="/inloggen">
        Inloggen met LinkedIn
      </Link>
      <p className="fine">
        Geen code?{" "}
        <Link href="/request-access" style={{ textDecoration: "underline", color: "var(--ink)" }}>
          Vraag toegang aan
        </Link>
      </p>
    </>
  );
}
