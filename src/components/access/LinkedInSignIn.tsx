"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";

// LinkedIn button in the auth style (`.btn.li.full`). After LinkedIn, the waiting screen
// sends everyone to the right place (onboarding, waiting or the community).
export function LinkedInSignIn({
  label,
  callbackUrl = "/wachten",
  className,
}: {
  label: string;
  callbackUrl?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function go() {
    setBusy(true);
    setError(false);
    try {
      await signIn("linkedin", { callbackUrl });
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <>
      <button data-press className={cn("btn li full", className)} type="button" onClick={go} disabled={busy} aria-busy={busy}>
        <span className="in" aria-hidden="true">
          in
        </span>
        {busy ? "LinkedIn wordt geopend..." : label}
      </button>
      {error ? (
        <p className="msg err" role="alert">
          LinkedIn reageert nu niet. Probeer het over een paar minuten opnieuw.
        </p>
      ) : null}
    </>
  );
}
